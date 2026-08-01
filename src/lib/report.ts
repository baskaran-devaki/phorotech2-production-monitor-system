import {
  ALL_SHIFTS,
  SHIFTS,
  monthNameFromKey,
  pad,
  type ProductionEntry,
  type ShiftNum,
} from "./production";

export const WORKING_DAY_MIN_LOADS = 40;
export const WEEKDAY_TARGET = 240;
export const SUNDAY_TARGET = 120;

export interface DayRow {
  date: string;
  isSunday: boolean;
  shiftTotals: Record<ShiftNum, number>;
  total: number;
  remarks: string;
  isWorkingDay: boolean;
  target: number;
  hourly: Array<{ shift: ShiftNum; slots: Array<{ slot: string; loads: number }>; shiftTotal: number }>;
}

export interface ReportData {
  from: string;
  to: string;
  periodLabel: string;
  days: DayRow[];
  totalWorkingDays: number;
  weekdayWorkingDays: number;
  sundayWorkingDays: number;
  totalActual: number;
  totalTarget: number;
  achievement: number;
  shiftTotals: Record<ShiftNum, number>;
  sundayTotal: number;
  highest: { date: string | null; loads: number };
  trend: Array<{ date: string; loads: number }>;
}

export function monthRange(mKey: string): { from: string; to: string } {
  const [y, m] = mKey.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${mKey}-01`, to: `${mKey}-${pad(last)}` };
}

export function monthOptions(count = 24, now = new Date()): Array<{ key: string; label: string }> {
  const out: Array<{ key: string; label: string }> = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    out.push({ key, label: monthNameFromKey(key) });
  }
  return out;
}

function isSundayDate(dateStr: string): boolean {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay() === 0;
}

export function buildReport(
  entries: ProductionEntry[],
  from: string,
  to: string,
  periodLabel?: string,
): ReportData {
  const inRange = entries.filter((e) => e.entry_date >= from && e.entry_date <= to);
  const dates = Array.from(new Set(inRange.map((e) => e.entry_date))).sort();

  const days: DayRow[] = dates.map((date) => {
    const dayEntries = inRange.filter((e) => e.entry_date === date);
    const shiftTotals = { 1: 0, 2: 0, 3: 0 } as Record<ShiftNum, number>;
    for (const e of dayEntries) shiftTotals[e.shift as ShiftNum] += e.load_count || 0;
    const total = shiftTotals[1] + shiftTotals[2] + shiftTotals[3];
    const sunday = isSundayDate(date);
    const isWorkingDay = total >= WORKING_DAY_MIN_LOADS;
    const remarks = Array.from(
      new Set(dayEntries.map((e) => (e.remarks ?? "").trim()).filter(Boolean)),
    ).join("; ");
    const hourly = ALL_SHIFTS.map((s) => {
      const se = dayEntries.filter((e) => e.shift === s);
      const slots = SHIFTS[s].slots.map((slot, idx) => ({
        slot,
        loads: se.find((e) => e.slot_index === idx)?.load_count ?? 0,
      }));
      return { shift: s, slots, shiftTotal: slots.reduce((a, b) => a + b.loads, 0) };
    });
    return {
      date,
      isSunday: sunday,
      shiftTotals,
      total,
      remarks,
      isWorkingDay,
      target: isWorkingDay ? (sunday ? SUNDAY_TARGET : WEEKDAY_TARGET) : 0,
      hourly,
    };
  });

  const working = days.filter((d) => d.isWorkingDay);
  const sundayWorkingDays = working.filter((d) => d.isSunday).length;
  const weekdayWorkingDays = working.length - sundayWorkingDays;
  const totalTarget = weekdayWorkingDays * WEEKDAY_TARGET + sundayWorkingDays * SUNDAY_TARGET;
  const totalActual = days.reduce((s, d) => s + d.total, 0);

  const shiftTotals = { 1: 0, 2: 0, 3: 0 } as Record<ShiftNum, number>;
  for (const d of days) for (const s of ALL_SHIFTS) shiftTotals[s] += d.shiftTotals[s];

  let highest: { date: string | null; loads: number } = { date: null, loads: 0 };
  for (const d of days) if (d.total > highest.loads) highest = { date: d.date, loads: d.total };

  return {
    from,
    to,
    periodLabel: periodLabel ?? `${from} to ${to}`,
    days,
    totalWorkingDays: working.length,
    weekdayWorkingDays,
    sundayWorkingDays,
    totalActual,
    totalTarget,
    achievement: totalTarget ? (totalActual / totalTarget) * 100 : 0,
    shiftTotals,
    sundayTotal: days.filter((d) => d.isSunday).reduce((s, d) => s + d.total, 0),
    highest,
    trend: days.map((d) => ({ date: d.date, loads: d.total })),
  };
}
