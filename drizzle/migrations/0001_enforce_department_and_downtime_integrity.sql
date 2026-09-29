CREATE OR REPLACE FUNCTION public.user_has_permission(_user_id uuid, _permission public.permission_key)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE
    WHEN _user_id IS NULL OR _user_id <> auth.uid() THEN false
    WHEN public.is_super_admin(_user_id) THEN true
    WHEN public.has_role(_user_id, 'admin') AND EXISTS (SELECT 1 FROM public.profiles WHERE user_id = _user_id AND department = 'admin') THEN true
    ELSE EXISTS (
      SELECT 1 FROM public.user_permissions p
      JOIN public.profiles pr ON pr.user_id = p.user_id
      WHERE p.user_id = _user_id AND p.permission = _permission
        AND (p.permission NOT IN ('downtime_entry','downtime_close') OR pr.department = 'maintenance')
        AND (p.permission <> 'production_entry' OR pr.department = 'production')
    )
  END
$$;
REVOKE ALL ON FUNCTION public.user_has_permission(uuid, public.permission_key) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.user_has_permission(uuid, public.permission_key) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.enforce_downtime_integrity()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.maintenance_team;
BEGIN
  IF TG_TABLE_NAME = 'downtime_attendance' THEN
    SELECT * INTO m FROM public.maintenance_team WHERE id = NEW.maintenance_member_id AND is_active = true;
    IF NOT FOUND THEN RAISE EXCEPTION 'Choose an active maintenance member'; END IF;
    IF NOT EXISTS (SELECT 1 FROM public.downtime_records WHERE id = NEW.downtime_id) THEN RAISE EXCEPTION 'Incident not found'; END IF;
    NEW.employee_name_snapshot := m.employee_name;
    NEW.employee_id_snapshot := m.employee_id;
    NEW.designation_snapshot := m.designation;
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    IF NEW.status <> 'open' AND NEW.status <> 'resolved' THEN RAISE EXCEPTION 'Invalid initial downtime status'; END IF;
    IF NEW.status = 'resolved' AND NEW.end_time IS NULL THEN RAISE EXCEPTION 'Resolved downtime needs an end time'; END IF;
    RETURN NEW;
  END IF;
  IF OLD.status = 'closed' THEN RAISE EXCEPTION 'Closed downtime cannot be edited'; END IF;
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF (OLD.status = 'open' AND NEW.status NOT IN ('under_maintenance','resolved')) OR
       (OLD.status = 'under_maintenance' AND NEW.status NOT IN ('testing','resolved')) OR
       (OLD.status = 'testing' AND NEW.status <> 'resolved') OR
       (OLD.status = 'resolved' AND NEW.status <> 'closed') THEN
      RAISE EXCEPTION 'Invalid downtime status transition';
    END IF;
    IF NEW.status = 'closed' AND NOT public.user_has_permission(auth.uid(), 'downtime_close') THEN
      RAISE EXCEPTION 'Not permitted to close downtime';
    END IF;
    IF NEW.status IN ('resolved','closed') AND NEW.end_time IS NULL THEN
      RAISE EXCEPTION 'Resolved downtime needs an end time';
    END IF;
  END IF;
  IF NEW.created_by IS DISTINCT FROM OLD.created_by OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Incident origin cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_downtime_integrity() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER validate_downtime_record BEFORE INSERT OR UPDATE ON public.downtime_records FOR EACH ROW EXECUTE FUNCTION public.enforce_downtime_integrity();
CREATE TRIGGER snapshot_downtime_attendance BEFORE INSERT ON public.downtime_attendance FOR EACH ROW EXECUTE FUNCTION public.enforce_downtime_integrity();

CREATE OR REPLACE FUNCTION public.log_maintenance_team_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_email_v text;
BEGIN
  SELECT email INTO actor_email_v FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_logs(actor_id, actor_email, action, entity, entity_id, details)
  VALUES (auth.uid(), actor_email_v, lower(TG_OP), 'maintenance_team', NEW.id::text,
    jsonb_build_object('module', 'maintenance', 'result', 'success', 'before', CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END, 'after', to_jsonb(NEW)));
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.log_maintenance_team_change() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER audit_maintenance_team AFTER INSERT OR UPDATE ON public.maintenance_team FOR EACH ROW EXECUTE FUNCTION public.log_maintenance_team_change();

CREATE OR REPLACE FUNCTION public.log_permission_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE actor_email_v text;
BEGIN
  SELECT email INTO actor_email_v FROM auth.users WHERE id = auth.uid();
  INSERT INTO public.audit_logs(actor_id, actor_email, action, entity, entity_id, details)
  VALUES (auth.uid(), actor_email_v, lower(TG_OP), 'user_permission', COALESCE(NEW.id, OLD.id)::text,
    jsonb_build_object('module', 'administration', 'result', 'success', 'before', CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) ELSE NULL END, 'after', CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) ELSE NULL END));
  RETURN COALESCE(NEW, OLD);
END;
$$;
REVOKE ALL ON FUNCTION public.log_permission_change() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER audit_user_permissions AFTER INSERT OR UPDATE OR DELETE ON public.user_permissions FOR EACH ROW EXECUTE FUNCTION public.log_permission_change();