import { businessDate, currentShift } from "@/lib/production";
import type { Database } from "@/integrations/supabase/types";

export type DowntimeRecord = Database["public"]["Tables"]["downtime_records"]["Row"];
export type MaintenanceMember = Database["public"]["Tables"]["maintenance_team"]["Row"];
export type DowntimeStatus = Database["public"]["Enums"]["downtime_status"];
export type ReasonCategory = Database["public"]["Enums"]["downtime_reason_category"];

export const DOWNTIME_STATUSES: Array<{ value: DowntimeStatus; label: string }> = [
  { value: "open", label: "Open" },
  { value: "under_maintenance", label: "Under Maintenance" },
  { value: "testing", label: "Testing" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const REASON_CATEGORIES: Array<{ value: ReasonCategory; label: string }> = [
  { value: "mechanical", label: "Mechanical" }, { value: "electrical", label: "Electrical" },
  { value: "automation", label: "Automation" }, { value: "material", label: "Material" },
  { value: "process", label: "Process" }, { value: "other", label: "Other" },
];

export function newDowntimeDefaults() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
  return { business_date: businessDate(now), shift: currentShift(now), start_time: local };
}

export function downtimeMinutes(record: Pick<DowntimeRecord, "start_time" | "end_time">, now = Date.now()) {
  const end = record.end_time ? new Date(record.end_time).getTime() : now;
  return Math.max(0, Math.round((end - new Date(record.start_time).getTime()) / 60_000));
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return hours ? `${hours}h ${remainder}m` : `${remainder}m`;
}