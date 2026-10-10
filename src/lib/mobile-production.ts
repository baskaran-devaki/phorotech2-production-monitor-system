import { SHIFTS, sumLoads, type ProductionEntry, type ShiftNum } from "./production";

/** Presentation-only projections; entry_date is already the stored business date. */
export function entriesForBusinessDate(entries: ProductionEntry[], date: string) {
  return entries.filter((entry) => entry.entry_date === date);
}

export function hourlyForShift(entries: ProductionEntry[], date: string, shift: ShiftNum) {
  const day = entriesForBusinessDate(entries, date);
  return SHIFTS[shift].slots.map((slot, index) => ({
    slot,
    loads: sumLoads(day.filter((entry) => entry.shift === shift && entry.slot_index === index)),
  }));
}

export function datesWithProduction(entries: ProductionEntry[]) {
  return new Set(entries.filter((entry) => entry.load_count > 0).map((entry) => entry.entry_date));
}