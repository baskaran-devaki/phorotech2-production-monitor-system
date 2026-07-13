export type ShiftNum = 1 | 2 | 3;

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
    range: "06:00 AM – 02:00 PM",
    slots: ["06-07", "07-08", "08-09", "09-10", "10-11", "11-12", "12-01", "01-02"],
  },
  2: {
    label: "Shift II",
    range: "02:00 PM – 10:00 PM",
    slots: ["02-03", "03-04", "04-05", "05-06", "06-07", "07-08", "08-09", "09-10"],
  },
  3: {
    label: "Shift III",
    range: "10:00 PM – 06:00 AM",
    slots: ["10-11", "11-12", "12-01", "01-02", "02-03", "03-04", "04-05", "05-06"],
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
