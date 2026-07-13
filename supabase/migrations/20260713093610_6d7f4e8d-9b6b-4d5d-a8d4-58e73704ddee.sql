
CREATE TABLE public.production_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_date DATE NOT NULL,
  shift SMALLINT NOT NULL CHECK (shift IN (1,2,3)),
  time_slot TEXT NOT NULL,
  slot_index SMALLINT NOT NULL,
  load_count INTEGER NOT NULL DEFAULT 0 CHECK (load_count >= 0),
  remarks TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entry_date, shift, slot_index)
);

CREATE INDEX idx_production_entries_date ON public.production_entries(entry_date);

GRANT SELECT ON public.production_entries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.production_entries TO authenticated;
GRANT ALL ON public.production_entries TO service_role;

ALTER TABLE public.production_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read production entries"
  ON public.production_entries FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Authenticated can insert"
  ON public.production_entries FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated can update"
  ON public.production_entries FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can delete"
  ON public.production_entries FOR DELETE TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_production_entries_updated_at
  BEFORE UPDATE ON public.production_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.production_entries;
ALTER TABLE public.production_entries REPLICA IDENTITY FULL;
