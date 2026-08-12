-- 1. Global production mode setting (single row)
CREATE TABLE public.production_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  mode text NOT NULL DEFAULT 'MANUAL' CHECK (mode IN ('AUTO','MANUAL')),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.production_settings TO anon;
GRANT SELECT, UPDATE ON public.production_settings TO authenticated;
GRANT ALL ON public.production_settings TO service_role;

ALTER TABLE public.production_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read production mode"
  ON public.production_settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins can change production mode"
  ON public.production_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.is_super_admin(auth.uid()));

CREATE TRIGGER update_production_settings_updated_at
  BEFORE UPDATE ON public.production_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.production_settings (id, mode) VALUES (true, 'MANUAL');

-- 2. Mode reader
CREATE OR REPLACE FUNCTION public.production_mode()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT mode FROM public.production_settings WHERE id
$$;

REVOKE ALL ON FUNCTION public.production_mode() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.production_mode() TO anon, authenticated, service_role;

-- 3. Fix "permission denied for function has_role" (needed by RLS policies evaluated as the caller)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- 4. Database-level mode enforcement on production_entries
CREATE OR REPLACE FUNCTION public.enforce_production_mode()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  current_mode text;
  iot_write text;
BEGIN
  current_mode := public.production_mode();
  iot_write := coalesce(current_setting('app.iot_write', true), '');

  IF iot_write = 'on' THEN
    IF current_mode <> 'AUTO' THEN
      RAISE EXCEPTION 'Production system is in MANUAL mode';
    END IF;
  ELSE
    IF current_mode <> 'MANUAL' THEN
      RAISE EXCEPTION 'Manual production entry is blocked: system is in AUTO mode';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_production_mode() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER enforce_production_mode_on_entries
  BEFORE INSERT OR UPDATE ON public.production_entries
  FOR EACH ROW EXECUTE FUNCTION public.enforce_production_mode();

-- 5. Mark IoT-originated writes inside the existing atomic RPC (logic otherwise unchanged)
CREATE OR REPLACE FUNCTION public.increment_production_load(_entry_date date, _shift smallint, _time_slot text, _slot_index smallint)
RETURNS production_entries LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result public.production_entries;
BEGIN
  IF public.production_mode() <> 'AUTO' THEN
    RAISE EXCEPTION 'Production system is in MANUAL mode';
  END IF;

  PERFORM set_config('app.iot_write', 'on', true);

  INSERT INTO public.production_entries (entry_date, shift, time_slot, slot_index, load_count, remarks)
  VALUES (_entry_date, _shift, _time_slot, _slot_index, 1, 'Automatic IoT')
  ON CONFLICT (entry_date, shift, slot_index)
  DO UPDATE SET load_count = public.production_entries.load_count + 1,
                updated_at = now()
  RETURNING * INTO result;

  PERFORM set_config('app.iot_write', 'off', true);
  RETURN result;
END;
$$;