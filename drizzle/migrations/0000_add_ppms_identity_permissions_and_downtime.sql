CREATE TYPE public.user_department AS ENUM ('production', 'maintenance', 'admin');
CREATE TYPE public.permission_key AS ENUM ('dashboard_view', 'production_view', 'production_entry', 'downtime_view', 'downtime_entry', 'downtime_close', 'reports', 'analytics', 'tv_mode', 'notifications');
CREATE TYPE public.downtime_reason_category AS ENUM ('mechanical', 'electrical', 'automation', 'material', 'process', 'other');
CREATE TYPE public.downtime_status AS ENUM ('open', 'under_maintenance', 'testing', 'resolved', 'closed');

CREATE TABLE public.profiles (
  user_id uuid PRIMARY KEY,
  username text NOT NULL,
  department public.user_department NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profiles_username_length CHECK (char_length(username) BETWEEN 2 AND 60)
);
CREATE UNIQUE INDEX profiles_username_lower_key ON public.profiles (lower(username));
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission public.permission_key NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);
CREATE INDEX idx_user_permissions_user ON public.user_permissions(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own permissions" ON public.user_permissions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins manage permissions" ON public.user_permissions FOR ALL TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id uuid, _permission public.permission_key)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
    OR public.has_role(_user_id, 'admin')
    OR EXISTS (
      SELECT 1 FROM public.user_permissions
      WHERE user_id = _user_id AND permission = _permission
    )
$$;
REVOKE ALL ON FUNCTION public.user_has_permission(uuid, public.permission_key) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_permission(uuid, public.permission_key) TO authenticated, service_role;

CREATE TABLE public.maintenance_team (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name text NOT NULL,
  employee_id text,
  designation text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT maintenance_team_name_required CHECK (btrim(employee_name) <> ''),
  CONSTRAINT maintenance_team_designation_required CHECK (btrim(designation) <> '')
);
CREATE UNIQUE INDEX maintenance_team_employee_id_key ON public.maintenance_team(employee_id) WHERE employee_id IS NOT NULL;
CREATE INDEX idx_maintenance_team_active ON public.maintenance_team(is_active);
GRANT SELECT, INSERT, UPDATE ON public.maintenance_team TO authenticated;
GRANT ALL ON public.maintenance_team TO service_role;
ALTER TABLE public.maintenance_team ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorized users read maintenance team" ON public.maintenance_team FOR SELECT TO authenticated USING (public.user_has_permission(auth.uid(), 'downtime_view') OR public.user_has_permission(auth.uid(), 'downtime_entry'));
CREATE POLICY "Authorized users add maintenance team" ON public.maintenance_team FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authorized users update maintenance team" ON public.maintenance_team FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin')) WITH CHECK (public.is_super_admin(auth.uid()) OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_maintenance_team_updated_at BEFORE UPDATE ON public.maintenance_team FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.downtime_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_date date NOT NULL,
  shift smallint NOT NULL CHECK (shift IN (1,2,3)),
  machine_process text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  reason_category public.downtime_reason_category NOT NULL,
  reason text NOT NULL,
  description text,
  action_taken text,
  parts_material_used text,
  before_photo_path text,
  after_photo_path text,
  status public.downtime_status NOT NULL DEFAULT 'open',
  created_by uuid NOT NULL,
  updated_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT downtime_machine_required CHECK (btrim(machine_process) <> ''),
  CONSTRAINT downtime_reason_required CHECK (btrim(reason) <> ''),
  CONSTRAINT downtime_time_order CHECK (end_time IS NULL OR end_time >= start_time),
  CONSTRAINT downtime_closed_has_end CHECK (status <> 'closed' OR end_time IS NOT NULL)
);
CREATE INDEX idx_downtime_business_date ON public.downtime_records(business_date DESC);
CREATE INDEX idx_downtime_status ON public.downtime_records(status);
CREATE INDEX idx_downtime_shift ON public.downtime_records(shift);
CREATE INDEX idx_downtime_machine ON public.downtime_records(machine_process);
CREATE INDEX idx_downtime_category ON public.downtime_records(reason_category);
CREATE INDEX idx_downtime_active ON public.downtime_records(start_time DESC) WHERE status <> 'closed';
GRANT SELECT, INSERT, UPDATE ON public.downtime_records TO authenticated;
GRANT ALL ON public.downtime_records TO service_role;
ALTER TABLE public.downtime_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorized users read downtime" ON public.downtime_records FOR SELECT TO authenticated USING (public.user_has_permission(auth.uid(), 'downtime_view'));
CREATE POLICY "Authorized users report downtime" ON public.downtime_records FOR INSERT TO authenticated WITH CHECK (public.user_has_permission(auth.uid(), 'downtime_entry') AND created_by = auth.uid() AND updated_by = auth.uid());
CREATE POLICY "Authorized users update downtime" ON public.downtime_records FOR UPDATE TO authenticated USING (public.user_has_permission(auth.uid(), 'downtime_entry')) WITH CHECK (public.user_has_permission(auth.uid(), 'downtime_entry') AND updated_by = auth.uid() AND (status <> 'closed' OR public.user_has_permission(auth.uid(), 'downtime_close')));
CREATE TRIGGER update_downtime_records_updated_at BEFORE UPDATE ON public.downtime_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.downtime_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  downtime_id uuid NOT NULL REFERENCES public.downtime_records(id) ON DELETE CASCADE,
  maintenance_member_id uuid REFERENCES public.maintenance_team(id) ON DELETE SET NULL,
  employee_name_snapshot text NOT NULL,
  employee_id_snapshot text,
  designation_snapshot text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (downtime_id, maintenance_member_id)
);
CREATE INDEX idx_downtime_attendance_incident ON public.downtime_attendance(downtime_id);
CREATE INDEX idx_downtime_attendance_member ON public.downtime_attendance(maintenance_member_id);
GRANT SELECT, INSERT, DELETE ON public.downtime_attendance TO authenticated;
GRANT ALL ON public.downtime_attendance TO service_role;
ALTER TABLE public.downtime_attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorized users read attendance" ON public.downtime_attendance FOR SELECT TO authenticated USING (public.user_has_permission(auth.uid(), 'downtime_view'));
CREATE POLICY "Authorized users add attendance" ON public.downtime_attendance FOR INSERT TO authenticated WITH CHECK (public.user_has_permission(auth.uid(), 'downtime_entry') AND created_by = auth.uid());
CREATE POLICY "Authorized users remove attendance" ON public.downtime_attendance FOR DELETE TO authenticated USING (public.user_has_permission(auth.uid(), 'downtime_entry'));

CREATE TABLE public.retention_archive_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affected_year integer NOT NULL,
  production_record_count bigint NOT NULL DEFAULT 0,
  downtime_record_count bigint NOT NULL DEFAULT 0,
  archive_location text,
  archive_status text NOT NULL DEFAULT 'pending' CHECK (archive_status IN ('pending','created','verified','failed')),
  operation_result text NOT NULL DEFAULT 'not_started' CHECK (operation_result IN ('not_started','blocked','completed','failed')),
  verified_at timestamptz,
  executed_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  CONSTRAINT retention_completed_requires_verification CHECK (operation_result <> 'completed' OR (archive_status = 'verified' AND verified_at IS NOT NULL))
);
GRANT SELECT, INSERT, UPDATE ON public.retention_archive_runs TO authenticated;
GRANT ALL ON public.retention_archive_runs TO service_role;
ALTER TABLE public.retention_archive_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super admins read retention runs" ON public.retention_archive_runs FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));
CREATE POLICY "Super admins create retention runs" ON public.retention_archive_runs FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()) AND executed_by = auth.uid());
CREATE POLICY "Super admins update retention runs" ON public.retention_archive_runs FOR UPDATE TO authenticated USING (public.is_super_admin(auth.uid())) WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Authorized users upload maintenance photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'maintenance-photos' AND public.user_has_permission(auth.uid(), 'downtime_entry'));
CREATE POLICY "Authorized users view maintenance photos" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'maintenance-photos' AND public.user_has_permission(auth.uid(), 'downtime_view'));
CREATE POLICY "Authorized users update maintenance photos" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'maintenance-photos' AND public.user_has_permission(auth.uid(), 'downtime_entry')) WITH CHECK (bucket_id = 'maintenance-photos' AND public.user_has_permission(auth.uid(), 'downtime_entry'));

CREATE OR REPLACE FUNCTION public.log_downtime_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_email_v text; actor_department_v text;
BEGIN
  SELECT email INTO actor_email_v FROM auth.users WHERE id = auth.uid();
  SELECT department::text INTO actor_department_v FROM public.profiles WHERE user_id = auth.uid();
  INSERT INTO public.audit_logs(actor_id, actor_email, action, entity, entity_id, details)
  VALUES (
    auth.uid(), actor_email_v, lower(TG_OP), 'downtime_record', COALESCE(NEW.id, OLD.id)::text,
    jsonb_build_object('department', actor_department_v, 'module', 'downtime', 'result', 'success', 'before', CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END, 'after', CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE ALL ON FUNCTION public.log_downtime_change() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER audit_downtime_records AFTER INSERT OR UPDATE ON public.downtime_records FOR EACH ROW EXECUTE FUNCTION public.log_downtime_change();

ALTER PUBLICATION supabase_realtime ADD TABLE public.downtime_records;
ALTER TABLE public.downtime_records REPLICA IDENTITY FULL;