
-- 1. Super Admin flag table (super admin is admin + super_admin)
CREATE TABLE public.super_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.super_admins TO authenticated;
GRANT ALL ON public.super_admins TO service_role;
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth can read super_admins" ON public.super_admins FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = _user_id)
$$;

-- 2. Promote the existing bootstrapped admin (earliest admin row) to super_admin.
INSERT INTO public.super_admins(user_id)
SELECT user_id FROM public.user_roles WHERE role = 'admin'
ORDER BY created_at ASC LIMIT 1
ON CONFLICT DO NOTHING;

-- 3. Update assign_default_role: first user is super_admin+admin; subsequent = user
CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.super_admins) THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
    INSERT INTO public.super_admins(user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSE
    -- Check if this signup was invited by a super admin as an admin
    IF EXISTS (SELECT 1 FROM public.admin_invites WHERE lower(email) = lower(NEW.email) AND accepted_at IS NULL AND revoked_at IS NULL) THEN
      INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'admin') ON CONFLICT DO NOTHING;
      UPDATE public.admin_invites SET accepted_at = now(), accepted_user_id = NEW.id
        WHERE lower(email) = lower(NEW.email) AND accepted_at IS NULL AND revoked_at IS NULL;
    ELSE
      INSERT INTO public.user_roles(user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Admin invites
CREATE TABLE public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accepted_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_invites TO authenticated;
GRANT ALL ON public.admin_invites TO service_role;
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admins read invites" ON public.admin_invites FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

-- Recreate the trigger after we changed the function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_default_role();

-- 5. Plant Head (single row, super admin only)
CREATE TABLE public.plant_head (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL DEFAULT '',
  employee_id text NOT NULL DEFAULT '',
  official_email text NOT NULL DEFAULT '',
  mobile_primary text NOT NULL DEFAULT '',
  mobile_alternate text,
  designation text NOT NULL DEFAULT 'Plant Head',
  department text,
  status text NOT NULL DEFAULT 'active',
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.plant_head TO authenticated;
GRANT ALL ON public.plant_head TO service_role;
ALTER TABLE public.plant_head ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin read plant_head" ON public.plant_head FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "super admin insert plant_head" ON public.plant_head FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "super admin update plant_head" ON public.plant_head FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER update_plant_head_updated_at BEFORE UPDATE ON public.plant_head FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
INSERT INTO public.plant_head (full_name, employee_id, official_email, mobile_primary, designation) VALUES ('', '', '', '', 'Plant Head');

-- 6. Audit log
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  action text NOT NULL,
  entity text NOT NULL,
  entity_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "super admin read audit" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "authenticated write audit" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = actor_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- 7. Audit triggers on production_entries
CREATE OR REPLACE FUNCTION public.log_production_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_email_v text;
BEGIN
  SELECT email INTO actor_email_v FROM auth.users WHERE id = auth.uid();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs(actor_id, actor_email, action, entity, entity_id, details)
    VALUES (auth.uid(), actor_email_v, 'insert', 'production_entry', NEW.id::text, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs(actor_id, actor_email, action, entity, entity_id, details)
    VALUES (auth.uid(), actor_email_v, 'update', 'production_entry', NEW.id::text, jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW)));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs(actor_id, actor_email, action, entity, entity_id, details)
    VALUES (auth.uid(), actor_email_v, 'delete', 'production_entry', OLD.id::text, to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;
CREATE TRIGGER audit_production_entries
AFTER INSERT OR UPDATE OR DELETE ON public.production_entries
FOR EACH ROW EXECUTE FUNCTION public.log_production_change();

-- 8. Update user_roles policies to allow super admin manage
CREATE POLICY "super admin read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "super admin manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

-- 9. Restrict production_entries writes: currently admins (which includes super admins since they hold admin role). Users are read-only via existing anon SELECT policy. No change needed — but ensure user role users cannot write (they don't have admin row). Good.
