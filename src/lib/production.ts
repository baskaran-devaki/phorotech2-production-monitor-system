export type ShiftNum = 1 | 2 | 3;

export const SHIFT_TARGET = 80;
export const DAILY_TARGET = SHIFT_TARGET * 3;
export const MONTHLY_TARGET = DAILY_TARGET * 30;
export const CELEBRATE_THRESHOLD = 200;


export interface ProductionEntry {
  id: string;
  entry_date: string; // YYYY-MM-DD
  shift: ShiftNum;
  time_slot: string;
  slot_index: number;
  load_count: number;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export const SHIFTS: Record<ShiftNum, { label: string; range: string; slots: string[] }> = {
  1: {
    label: "Shift I",
    range: "06:00 AM - 02:00 PM",
    slots: [
      "06:00 AM - 07:00 AM",
      "07:00 AM - 08:00 AM",
      "08:00 AM - 09:00 AM",
      "09:00 AM - 10:00 AM",
      "10:00 AM - 11:00 AM",
      "11:00 AM - 12:00 PM",
      "12:00 PM - 01:00 PM",
      "01:00 PM - 02:00 PM",
    ],
  },
  2: {
    label: "Shift II",
    range: "02:00 PM - 10:00 PM",
    slots: [
      "02:00 PM - 03:00 PM",
      "03:00 PM - 04:00 PM",
      "04:00 PM - 05:00 PM",
      "05:00 PM - 06:00 PM",
      "06:00 PM - 07:00 PM",
      "07:00 PM - 08:00 PM",
      "08:00 PM - 09:00 PM",
      "09:00 PM - 10:00 PM",
    ],
  },
  3: {
    label: "Shift III",
    range: "10:00 PM - 06:00 AM",
    slots: [
      "10:00 PM - 11:00 PM",
      "11:00 PM - 12:00 AM",
      "12:00 AM - 01:00 AM",
      "01:00 AM - 02:00 AM",
      "02:00 AM - 03:00 AM",
      "03:00 AM - 04:00 AM",
      "04:00 AM - 05:00 AM",
      "05:00 AM - 06:00 AM",
    ],
  },
};

export const ALL_SHIFTS: ShiftNum[] = [1, 2, 3];

export const pad = (n: number) => n.toString().padStart(2, "0");

export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function currentShift(now = new Date()): ShiftNum {
  const h = now.getHours();
  if (h >= 6 && h < 14) return 1;
  if (h >= 14 && h < 22) return 2;
  return 3;
}

/** Business day starts at 06:00. Before 06:00, "today" is still previous calendar day. */
export function businessDate(now = new Date()): string {
  const d = new Date(now);
  if (d.getHours() < 6) d.setDate(d.getDate() - 1);
  return toDateStr(d);
}

export function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // YYYY-MM
}

export function currentMonthKey(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`;
}

export function monthName(now = new Date()): string {
  return now.toLocaleString("en-IN", { month: "long", year: "numeric" });
}

export function sumLoads(entries: ProductionEntry[]): number {
  return entries.reduce((s, e) => s + (e.load_count || 0), 0);
}

export interface HighestRecord {
  date: string | null;
  shift: ShiftNum | null;
  loads: number;
  dailyTotal: number;
}

export function highestOfMonth(entries: ProductionEntry[], mKey: string): HighestRecord {
  const monthEntries = entries.filter((e) => monthKey(e.entry_date) === mKey);
  if (!monthEntries.length) return { date: null, shift: null, loads: 0, dailyTotal: 0 };

  const byDate = new Map<string, number>();
  for (const e of monthEntries) byDate.set(e.entry_date, (byDate.get(e.entry_date) ?? 0) + e.load_count);

  let bestDate: string | null = null;
  let bestTotal = 0;
  for (const [date, total] of byDate) {
    if (total > bestTotal) { bestTotal = total; bestDate = date; }
  }
  if (!bestDate) return { date: null, shift: null, loads: 0, dailyTotal: 0 };

  const dayEntries = monthEntries.filter((e) => e.entry_date === bestDate);
  const byShift = new Map<ShiftNum, number>();
  for (const e of dayEntries) byShift.set(e.shift, (byShift.get(e.shift) ?? 0) + e.load_count);
  let bestShift: ShiftNum = 1;
  let bestShiftLoads = 0;
  for (const [shift, total] of byShift) {
    if (total > bestShiftLoads) { bestShiftLoads = total; bestShift = shift; }
  }
  return { date: bestDate, shift: bestShift, loads: bestShiftLoads, dailyTotal: bestTotal };
}

export function formatIndianDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export function dailyTotalsForMonth(entries: ProductionEntry[], mKey: string): Array<{ date: string; loads: number }> {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (monthKey(e.entry_date) !== mKey) continue;
    map.set(e.entry_date, (map.get(e.entry_date) ?? 0) + e.load_count);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, loads]) => ({ date, loads }));
}

export function formatDMY(dateStr: string | null): string {
  if (!dateStr) return "—";
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${pad(d)}-${pad(m)}-${y}`;
}

/** Returns the last completed hour entry (before "now"): { slot, loads, date, shift } */
export function lastCompletedHour(
  entries: ProductionEntry[],
  now = new Date(),
): { slot: string; loads: number; date: string; shift: ShiftNum } | null {
  // Consider entries up to now, pick the one with the greatest (date, shift, slot_index)
  const bDate = businessDate(now);
  const candidates = entries.filter((e) => e.entry_date <= bDate);
  if (!candidates.length) return null;
  const sorted = [...candidates].sort((a, b) => {
    if (a.entry_date !== b.entry_date) return a.entry_date < b.entry_date ? 1 : -1;
    if (a.shift !== b.shift) return b.shift - a.shift;
    return b.slot_index - a.slot_index;
  });
  const e = sorted[0];
  const slotLabel = SHIFTS[e.shift]?.slots[e.slot_index] ?? e.time_slot;
  return { slot: slotLabel, loads: e.load_count, date: e.entry_date, shift: e.shift };
}

/** Most recent business day BEFORE today (with any entries) */
export function lastDayTotal(
  entries: ProductionEntry[],
  now = new Date(),
): { date: string; loads: number } | null {
  const today = businessDate(now);
  const byDate = new Map<string, number>();
  for (const e of entries) {
    if (e.entry_date >= today) continue;
    byDate.set(e.entry_date, (byDate.get(e.entry_date) ?? 0) + e.load_count);
  }
  if (!byDate.size) return null;
  const sorted = [...byDate.entries()].sort(([a], [b]) => (a < b ? 1 : -1));
  return { date: sorted[0][0], loads: sorted[0][1] };
}

export function previousMonthKey(now = new Date()): string {
  const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

export function monthNameFromKey(mKey: string): string {
  const [y, m] = mKey.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "long", year: "numeric" });
}

export function totalForMonth(entries: ProductionEntry[], mKey: string): number {
  return entries.filter((e) => monthKey(e.entry_date) === mKey).reduce((s, e) => s + e.load_count, 0);
}

/** All days in current month with total >= threshold */
export function celebratedDays(
  entries: ProductionEntry[],
  mKey: string,
  threshold = CELEBRATE_THRESHOLD,
): Array<{ date: string; loads: number }> {
  return dailyTotalsForMonth(entries, mKey).filter((d) => d.loads >= threshold);
}

