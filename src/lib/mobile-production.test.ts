import { describe, expect, test } from "bun:test";
import { businessDate, currentShift, sumLoads, type ProductionEntry } from "./production";
import { datesWithProduction, entriesForBusinessDate, hourlyForShift } from "./mobile-production";

const entry = (date: string, shift: 1 | 2 | 3, index: number, loads: number): ProductionEntry => ({
  id: `${date}-${shift}-${index}`, entry_date: date, shift, slot_index: index,
  time_slot: "", load_count: loads, remarks: null, created_at: "", updated_at: "",
});

describe("mobile historical production", () => {
  test("only the selected business date contributes to its daily total", () => {
    const rows = [entry("2026-09-02", 1, 0, 60), entry("2026-09-02", 2, 0, 70), entry("2026-09-02", 3, 7, 62), entry("2026-10-10", 1, 0, 99)];
    expect(sumLoads(entriesForBusinessDate(rows, "2026-09-02"))).toBe(192);
  });
  test("historical Shift III includes all eight slots and never current live rows", () => {
    const rows = [entry("2026-09-02", 3, 0, 20), entry("2026-09-02", 3, 2, 30), entry("2026-09-02", 3, 7, 12), entry("2026-10-10", 3, 7, 99)];
    const hourly = hourlyForShift(rows, "2026-09-02", 3);
    expect(hourly.length).toBe(8);
    expect(hourly[2]).toEqual({ slot: "12:00 AM - 01:00 AM", loads: 30 });
    expect(hourly[7]).toEqual({ slot: "05:00 AM - 06:00 AM", loads: 12 });
    expect(hourly.reduce((total, row) => total + row.loads, 0)).toBe(62);
  });
  test("calendar distinguishes actual production from zero or absent records", () => {
    const dates = datesWithProduction([entry("2026-09-02", 1, 0, 192), entry("2026-09-03", 1, 0, 0)]);
    expect(dates.has("2026-09-02")).toBe(true);
    expect(dates.has("2026-09-03")).toBe(false);
    expect(dates.has("2026-09-04")).toBe(false);
    expect(entriesForBusinessDate([], "2026-09-04")).toEqual([]);
  });
  test("midnight and 05:59 remain previous business day; reset happens at 06:00", () => {
    expect(businessDate(new Date(2026, 9, 10, 0, 0))).toBe("2026-10-09");
    expect(businessDate(new Date(2026, 9, 10, 5, 59))).toBe("2026-10-09");
    expect(currentShift(new Date(2026, 9, 10, 5, 59))).toBe(3);
    expect(businessDate(new Date(2026, 9, 10, 6, 0))).toBe("2026-10-10");
    expect(currentShift(new Date(2026, 9, 10, 6, 0))).toBe(1);
  });
});