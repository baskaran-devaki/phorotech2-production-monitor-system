import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserAccess } from "@/hooks/useUserAccess";
import { useAuthUser } from "@/hooks/useProduction";
import { DOWNTIME_STATUSES, REASON_CATEGORIES, downtimeMinutes, formatDuration, newDowntimeDefaults, type DowntimeRecord, type MaintenanceMember, type DowntimeStatus, type ReasonCategory } from "@/lib/downtime";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Activity, History, Plus, Users, BarChart3, FileDown, RefreshCw, Camera, Loader2 } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/downtime")({
  head: () => ({ meta: [
    { title: "Downtime Management · Phorotech" },
    { name: "description", content: "Maintenance incidents and downtime records at Phorotech ED Plant." },
    { property: "og:title", content: "Downtime Management · Phorotech" },
    { property: "og:description", content: "Maintenance incidents and downtime records at Phorotech ED Plant." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: DowntimePage,
});

type View = "active" | "report" | "history" | "team" | "analytics";
type Attendance = Database["public"]["Tables"]["downtime_attendance"]["Row"];
const pageSize = 500;
const formatDateTime = (value: string) => new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

function DowntimePage() {
  const { user, isAdmin, isSuperAdmin } = useAuthUser();
  const access = useUserAccess();
  const [view, setView] = useState<View>("active");
  const [records, setRecords] = useState<DowntimeRecord[]>([]);
  const [team, setTeam] = useState<MaintenanceMember[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("all");

  const canView = isSuperAdmin || isAdmin || access.hasPermission("downtime_view");
  const canEntry = isSuperAdmin || isAdmin || (access.department === "maintenance" && access.hasPermission("downtime_entry"));
  const canClose = isSuperAdmin || isAdmin || (access.department === "maintenance" && access.hasPermission("downtime_close"));

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const all: DowntimeRecord[] = [];
      for (let offset = 0; ; offset += pageSize) {
        const { data, error } = await supabase.from("downtime_records").select("*").order("start_time", { ascending: false }).range(offset, offset + pageSize - 1);
        if (error) throw error;
        all.push(...(data ?? []));
        if (!data || data.length < pageSize) break;
      }
      const [{ data: members, error: teamError }, { data: people, error: attendanceError }] = await Promise.all([
        supabase.from("maintenance_team").select("*").order("employee_name"),
        supabase.from("downtime_attendance").select("*"),
      ]);
      if (teamError) throw teamError;
      if (attendanceError) throw attendanceError;
      setRecords(all);
      setTeam(members ?? []);
      setAttendance(people ?? []);
    } catch (error) { toast.error((error as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (canView) void reload(); }, [canView, reload]);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    const channel = supabase.channel("ppms-downtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "downtime_records" }, () => void reload())
      .subscribe();
    return () => { clearInterval(timer); void supabase.removeChannel(channel); };
  }, [reload]);

  const filtered = useMemo(() => records.filter((record) =>
    (!from || record.business_date >= from) && (!to || record.business_date <= to) && (status === "all" || record.status === status)
  ), [records, from, to, status]);
  const active = filtered.filter((record) => record.status !== "closed");
  const completed = filtered.filter((record) => record.status === "closed");
  const totalMinutes = filtered.reduce((total, record) => total + downtimeMinutes(record, now), 0);
  const avgMinutes = filtered.length ? Math.round(totalMinutes / filtered.length) : 0;

  if (user === undefined || access.loading) return <main className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-primary" /></main>;
  if (!canView) return <main className="mx-auto max-w-4xl px-4 py-12"><h1 className="display gold-text text-2xl">Access restricted</h1><p className="mt-3 text-muted-foreground">Contact your Super Admin to request Downtime access.</p><Link to="/" className="mt-6 inline-block text-primary">Back to dashboard</Link></main>;

  const tabs: Array<{ key: View; label: string; icon: typeof Activity }> = [
    { key: "active", label: "Active", icon: Activity },
    { key: "report", label: "Report Downtime", icon: Plus },
    { key: "history", label: "History", icon: History },
    { key: "team", label: "Maintenance Team", icon: Users },
    { key: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return <main className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 py-5 space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
      <div><Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="size-4" /> Dashboard</Link><h1 className="display gold-text mt-2 text-3xl font-bold">Downtime Management</h1><p className="text-sm text-muted-foreground">Phorotech Surfin India · ED Plant</p></div>
      <Button variant="outline" onClick={() => void reload()} disabled={loading} title="Refresh records"><RefreshCw className="size-4" /> Refresh</Button>
    </header>
    <nav className="flex gap-1 overflow-x-auto border-b border-border pb-2" aria-label="Downtime views">
      {tabs.filter(({ key }) => key !== "report" || canEntry).map(({ key, label, icon: Icon }) => <Button key={key} size="sm" variant={view === key ? "default" : "ghost"} onClick={() => setView(key)} className="shrink-0"><Icon className="size-4" />{label}</Button>)}
    </nav>
    {view !== "report" && view !== "team" && <div className="flex flex-wrap items-end gap-3">
      <label className="text-xs text-muted-foreground">From<input type="date" className="input mt-1 block" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
      <label className="text-xs text-muted-foreground">To<input type="date" className="input mt-1 block" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></label>
      <label className="text-xs text-muted-foreground">Status<select className="input mt-1 block" value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option>{DOWNTIME_STATUSES.map(({ value, label }) => <option value={value} key={value}>{label}</option>)}</select></label>
      {(from || to || status !== "all") && <Button variant="ghost" onClick={() => { setFrom(""); setTo(""); setStatus("all"); }}>Clear</Button>}
    </div>}
    {view === "active" && <RecordList records={active} attendance={attendance} now={now} canEntry={canEntry} canClose={canClose} onSaved={reload} empty="No active downtime incidents." />}
    {view === "history" && <RecordList records={filtered} attendance={attendance} now={now} canEntry={canEntry} canClose={canClose} onSaved={reload} empty="No downtime records for this period." />}
    {view === "report" && canEntry && <ReportForm userId={user?.id ?? ""} team={team} onSaved={() => { void reload(); setView("active"); }} />}
    {view === "team" && <TeamView members={team} canManage={isAdmin || isSuperAdmin} userId={user?.id ?? ""} onSaved={reload} />}
    {view === "analytics" && <section className="space-y-5"><div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Metric label="Incidents" value={filtered.length.toLocaleString("en-IN")} /><Metric label="Active" value={active.length.toLocaleString("en-IN")} /><Metric label="Closed" value={completed.length.toLocaleString("en-IN")} /><Metric label="Total Downtime" value={formatDuration(totalMinutes)} />
    </div><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"><Metric label="Average Duration" value={formatDuration(avgMinutes)} /><Metric label="Longest Incident" value={formatDuration(Math.max(0, ...filtered.map((r) => downtimeMinutes(r, now))))} /><Metric label="People Attended" value={new Set(attendance.filter((person) => filtered.some((r) => r.id === person.downtime_id)).map((person) => person.employee_name_snapshot)).size.toString()} /></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{["Reason", "Shift", "Process"].map((group) => <div key={group} className="border-t border-border pt-4"><h2 className="text-lg font-semibold mb-3">By {group}</h2>{Object.entries(filtered.reduce<Record<string, number>>((map, record) => { const key = group === "Reason" ? record.reason_category : group === "Shift" ? `Shift ${record.shift}` : record.machine_process; map[key] = (map[key] ?? 0) + downtimeMinutes(record, now); return map; }, {})).sort((a, b) => b[1] - a[1]).map(([key, minutes]) => <div className="flex justify-between gap-3 border-b border-border py-2 text-sm" key={key}><span className="capitalize">{key.replaceAll("_", " ")}</span><strong>{formatDuration(minutes)}</strong></div>)}</div>)}</div></section>}
    {loading && <p className="text-sm text-muted-foreground">Updating records…</p>}
  </main>;
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="border border-border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">{label}</div><div className="mt-2 text-2xl font-bold text-primary">{value}</div></div>; }

function RecordList({ records, attendance, now, canEntry, canClose, onSaved, empty }: { records: DowntimeRecord[]; attendance: Attendance[]; now: number; canEntry: boolean; canClose: boolean; onSaved: () => void; empty: string }) {
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  async function changeStatus(record: DowntimeRecord, next: DowntimeStatus) {
    if (next === "closed" && !canClose) return;
    setSaving(record.id);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sign in again");
      const { error } = await supabase.from("downtime_records").update({ status: next, updated_by: auth.user.id, end_time: next === "closed" ? (record.end_time ?? new Date().toISOString()) : record.end_time }).eq("id", record.id);
      if (error) throw error;
      toast.success("Status updated"); onSaved();
    } catch (error) { toast.error((error as Error).message); } finally { setSaving(null); }
  }
  return <div className="space-y-3">{records.length === 0 && <p className="py-12 text-center text-muted-foreground">{empty}</p>}{records.map((record) => <article key={record.id} className="border border-border bg-card p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h2 className="font-bold text-lg break-words">{record.machine_process}</h2><p className="text-xs text-muted-foreground">{record.business_date} · Shift {record.shift} · {formatDateTime(record.start_time)}</p></div><div className="text-right"><span className="text-xs font-semibold uppercase text-primary">{record.status.replaceAll("_", " ")}</span><div className="text-xl font-bold tabular-nums">{formatDuration(downtimeMinutes(record, now))}</div></div></div>
    <p className="mt-3 text-sm"><span className="capitalize text-primary">{record.reason_category}</span> · {record.reason}</p>
    <Button variant="ghost" size="sm" className="mt-2" onClick={() => setExpanded(expanded === record.id ? null : record.id)}>{expanded === record.id ? "Hide details" : "Details"}</Button>
    {expanded === record.id && <div className="mt-3 space-y-2 border-t border-border pt-3 text-sm text-muted-foreground"><p>{record.description || "No description"}</p>{record.action_taken && <p><strong>Action:</strong> {record.action_taken}</p>}{record.parts_material_used && <p><strong>Parts:</strong> {record.parts_material_used}</p>}<p><strong>Attended by:</strong> {attendance.filter((person) => person.downtime_id === record.id).map((person) => `${person.employee_name_snapshot} (${person.designation_snapshot})`).join(", ") || "—"}</p>}{record.end_time && <p><strong>Ended:</strong> {formatDateTime(record.end_time)}</p>}<PhotoLink path={record.before_photo_path} label="Before photo" /><PhotoLink path={record.after_photo_path} label="After photo" /></div>}
    {canEntry && record.status !== "closed" && <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">{DOWNTIME_STATUSES.filter(({ value }) => value !== record.status && (value !== "closed" || canClose)).map(({ value, label }) => <Button variant="outline" size="sm" key={value} disabled={saving === record.id} onClick={() => void changeStatus(record, value)}>{label}</Button>)}</div>}
  </article>)}</div>;
}

function PhotoLink({ path, label }: { path: string | null; label: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { if (!path) return; let active = true; void supabase.storage.from("maintenance-photos").createSignedUrl(path, 300).then(({ data }) => { if (active) setUrl(data?.signedUrl ?? null); }); return () => { active = false; }; }, [path]);
  if (!url) return null;
  return <a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary underline mr-3"><Camera className="size-4" />{label}</a>;
}

function ReportForm({ userId, team, onSaved }: { userId: string; team: MaintenanceMember[]; onSaved: () => void }) {
  const defaults = newDowntimeDefaults();
  const [date, setDate] = useState(defaults.business_date);
  const [shift, setShift] = useState<number>(defaults.shift);
  const [start, setStart] = useState(defaults.start_time);
  const [end, setEnd] = useState("");
  const [process, setProcess] = useState("");
  const [category, setCategory] = useState<ReasonCategory>("mechanical");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [action, setAction] = useState("");
  const [parts, setParts] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [before, setBefore] = useState<File | null>(null);
  const [after, setAfter] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  async function upload(file: File, recordId: string, label: string) {
    if (!file.type.startsWith("image/") || file.size > 8_000_000) throw new Error("Photos must be images under 8 MB");
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Photo processing failed")), "image/jpeg", 0.78));
    const path = `${recordId}/${label}-${crypto.randomUUID()}.jpg`;
    const { error } = await supabase.storage.from("maintenance-photos").upload(path, blob, { contentType: "image/jpeg" });
    if (error) throw error;
    return path;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true);
    try {
      if (!userId) throw new Error("Sign in again");
      const startIso = new Date(start).toISOString();
      const endIso = end ? new Date(end).toISOString() : null;
      if (endIso && endIso < startIso) throw new Error("End time must follow start time");
      const { data: record, error } = await supabase.from("downtime_records").insert({ business_date: date, shift, machine_process: process.trim(), start_time: startIso, end_time: endIso, reason_category: category, reason: reason.trim(), description: description.trim() || null, action_taken: action.trim() || null, parts_material_used: parts.trim() || null, status: endIso ? "resolved" : "open", created_by: userId, updated_by: userId }).select("id").single();
      if (error) throw error;
      const members = team.filter((member) => selectedMembers.includes(member.id));
      if (members.length) {
        const { error: attendanceError } = await supabase.from("downtime_attendance").insert(members.map((member) => ({ downtime_id: record.id, maintenance_member_id: member.id, employee_name_snapshot: member.employee_name, employee_id_snapshot: member.employee_id, designation_snapshot: member.designation, created_by: userId })));
        if (attendanceError) throw attendanceError;
      }
      const beforePath = before ? await upload(before, record.id, "before") : null;
      const afterPath = after ? await upload(after, record.id, "after") : null;
      if (beforePath || afterPath) {
        const { error: photoError } = await supabase.from("downtime_records").update({ before_photo_path: beforePath, after_photo_path: afterPath, updated_by: userId }).eq("id", record.id);
        if (photoError) throw photoError;
      }
      toast.success("Downtime recorded"); onSaved();
    } catch (error) { toast.error((error as Error).message); } finally { setSaving(false); }
  }
  return <form onSubmit={(event) => void submit(event)} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl">
    <label className="text-sm">Business Date<input type="date" className="input mt-1 w-full" required value={date} onChange={(e) => setDate(e.target.value)} /></label>
    <label className="text-sm">Shift<select className="input mt-1 w-full" value={shift} onChange={(e) => setShift(Number(e.target.value))}>{[1, 2, 3].map((n) => <option key={n} value={n}>Shift {n}</option>)}</select></label>
    <label className="text-sm">Machine / Process<input className="input mt-1 w-full" required maxLength={180} value={process} onChange={(e) => setProcess(e.target.value)} /></label>
    <label className="text-sm">Reason Category<select className="input mt-1 w-full" value={category} onChange={(e) => setCategory(e.target.value as ReasonCategory)}>{REASON_CATEGORIES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></label>
    <label className="text-sm">Start Time<input type="datetime-local" className="input mt-1 w-full" required value={start} onChange={(e) => setStart(e.target.value)} /></label>
    <label className="text-sm">End Time (optional)<input type="datetime-local" className="input mt-1 w-full" min={start} value={end} onChange={(e) => setEnd(e.target.value)} /></label>
    <label className="text-sm sm:col-span-2">Reason<input className="input mt-1 w-full" required maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
    <label className="text-sm sm:col-span-2">Description<textarea className="input mt-1 w-full min-h-20" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
    <label className="text-sm sm:col-span-2">Action Taken<textarea className="input mt-1 w-full min-h-20" value={action} onChange={(e) => setAction(e.target.value)} /></label>
    <label className="text-sm sm:col-span-2">Parts / Material Used<input className="input mt-1 w-full" value={parts} onChange={(e) => setParts(e.target.value)} /></label>
    <fieldset className="sm:col-span-2"><legend className="text-sm mb-2">Attended By</legend><div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{team.filter((member) => member.is_active).map((member) => <label key={member.id} className="flex items-center gap-2 text-sm border border-border p-2"><input type="checkbox" checked={selectedMembers.includes(member.id)} onChange={(e) => setSelectedMembers(e.target.checked ? [...selectedMembers, member.id] : selectedMembers.filter((id) => id !== member.id))} />{member.employee_name} · {member.designation}</label>)}</div></fieldset>
    <label className="text-sm">Before Photo<input type="file" accept="image/*" capture="environment" className="mt-2 block w-full text-xs" onChange={(e) => setBefore(e.target.files?.[0] ?? null)} /></label>
    <label className="text-sm">After Photo<input type="file" accept="image/*" capture="environment" className="mt-2 block w-full text-xs" onChange={(e) => setAfter(e.target.files?.[0] ?? null)} /></label>
    <div className="sm:col-span-2"><Button type="submit" disabled={saving}>{saving ? <Loader2 className="animate-spin" /> : <Plus />}Record Downtime</Button></div>
  </form>;
}

function TeamView({ members, canManage, userId, onSaved }: { members: MaintenanceMember[]; canManage: boolean; userId: string; onSaved: () => void }) {
  const [name, setName] = useState(""); const [employeeId, setEmployeeId] = useState(""); const [designation, setDesignation] = useState(""); const [busy, setBusy] = useState(false);
  async function add(event: React.FormEvent) {
    event.preventDefault(); setBusy(true);
    const { error } = await supabase.from("maintenance_team").insert({ employee_name: name.trim(), employee_id: employeeId.trim() || null, designation: designation.trim(), created_by: userId, updated_by: userId });
    if (error) toast.error(error.message); else { toast.success("Team member added"); setName(""); setEmployeeId(""); setDesignation(""); onSaved(); }
    setBusy(false);
  }
  async function toggle(member: MaintenanceMember) {
    const { error } = await supabase.from("maintenance_team").update({ is_active: !member.is_active, updated_by: userId }).eq("id", member.id);
    if (error) toast.error(error.message); else { toast.success("Team updated"); onSaved(); }
  }
  return <div className="space-y-5">{canManage && <form onSubmit={(e) => void add(e)} className="flex flex-wrap items-end gap-3"><label className="text-sm">Employee Name<input className="input mt-1 block" required value={name} onChange={(e) => setName(e.target.value)} /></label><label className="text-sm">Employee ID (optional)<input className="input mt-1 block" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} /></label><label className="text-sm">Role / Designation<input className="input mt-1 block" required value={designation} onChange={(e) => setDesignation(e.target.value)} /></label><Button disabled={busy}><Plus /> Add Member</Button></form>}
    <div className="divide-y divide-border">{members.map((member) => <div key={member.id} className="flex flex-wrap justify-between items-center gap-3 py-3"><div><strong>{member.employee_name}</strong><p className="text-sm text-muted-foreground">{member.designation}{member.employee_id ? ` · ${member.employee_id}` : ""}</p></div>{canManage ? <Button variant="outline" size="sm" onClick={() => void toggle(member)}>{member.is_active ? "Deactivate" : "Activate"}</Button> : <span className="text-xs text-muted-foreground">{member.is_active ? "Active" : "Inactive"}</span>}</div>)}{!members.length && <p className="py-8 text-muted-foreground">No team members yet.</p>}</div>
  </div>;
}