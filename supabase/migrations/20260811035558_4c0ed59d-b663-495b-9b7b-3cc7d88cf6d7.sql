CREATE OR REPLACE FUNCTION public.increment_production_load(
  _entry_date date,
  _shift smallint,
  _time_slot text,
  _slot_index smallint
)
RETURNS public.production_entries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.production_entries;
BEGIN
  INSERT INTO public.production_entries (entry_date, shift, time_slot, slot_index, load_count, remarks)
  VALUES (_entry_date, _shift, _time_slot, _slot_index, 1, 'Automatic IoT')
  ON CONFLICT (entry_date, shift, slot_index)
  DO UPDATE SET load_count = public.production_entries.load_count + 1,
                updated_at = now()
  RETURNING * INTO result;
  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_production_load(date, smallint, text, smallint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_production_load(date, smallint, text, smallint) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_production_load(date, smallint, text, smallint) TO service_role;
