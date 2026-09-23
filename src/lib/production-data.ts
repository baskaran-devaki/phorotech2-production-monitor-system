import { supabase } from "@/integrations/supabase/client";
import type { ProductionEntry } from "./production";

const PAGE_SIZE = 1000;

export async function fetchAllProductionEntries(
  period?: { from: string; to: string },
): Promise<ProductionEntry[]> {
  const entries: ProductionEntry[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    let query = supabase
      .from("production_entries")
      .select("*")
      .order("entry_date", { ascending: false })
      .order("shift", { ascending: true })
      .order("slot_index", { ascending: true });

    if (period) {
      query = query.gte("entry_date", period.from).lte("entry_date", period.to);
    }

    const { data, error } = await query.range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;

    const page = (data ?? []) as ProductionEntry[];
    entries.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return entries;
}