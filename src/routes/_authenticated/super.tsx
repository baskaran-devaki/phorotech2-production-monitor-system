import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useProduction";
import { toast } from "sonner";
import { ArrowLeft, LogOut, Loader2, ShieldAlert, UserPlus, Ban, Trash2, ShieldCheck, Shield, Save, Crown, Mail, KeyRound, Smartphone, LifeBuoy, Eye, EyeOff, CheckCircle2, AlertTriangle, Lock, Wrench } from "lucide-react";
import {
  listAdminUsers, inviteAdmin, setUserDisabled, deleteAdmin, setAdminRole, updateUserAccess,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/super")({
  head: () => ({ meta: [
    { title: "Super Admin · Phorotech" },
    { name: "description", content: "Phorotech PPMS account access, plant administration, and security." },
    { property: "og:title", content: "Super Admin · Phorotech" },
    { property: "og:description", content: "Phorotech PPMS account access, plant administration, and security." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: SuperAdminPanel,
});

type Tab = "admins" | "plant" | "security" | "audit";
type AdminUser = { id: string; email: string; created_at: string; last_sign_in_at: string | null; banned_until: string | null; roles: string[]; is_super_admin: boolean; username: string; department: "production" | "maintenance" | "admin" | null; permissions: string[] };
const ACCESS_OPTIONS = ["dashboard_view", "production_view", "production_entry", "downtime_view", "downtime_entry", "downtime_close", "reports", "analytics", "tv_mode", "notifications"] as const;
type AccessOption = typeof ACCESS_OPTIONS[number];
type Department = "production" | "maintenance" | "admin";

function SuperAdminPanel() {
  const navigate = useNavigate();
  const { user, isSuperAdmin } = useAuthUser();
  const [tab, setTab] = useState<Tab>("admins");

  if (user === undefined) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[color:var(--gold)]" /></div>;
  if (user && !isSuperAdmin) {
    return (
      <main className="relative z-10 min-h-screen grid place-items-center px-4">
        <div className="glass-gold max-w-md rounded-3xl p-8 text-center">
          <ShieldAlert className="h-10 w-10 mx-auto text-[color:var(--gold-light)]" />
          <h1 className="display gold-text text-2xl mt-3">Super Admin only</h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-2">This area is restricted to Super Admins.</p>
          <Link to="/" className="btn-gold rounded-xl mt-6 px-4 py-2 text-sm inline-block">Back to dashboard</Link>
        </div>
      </main>
    );
  }

  async function signOut() { await supabase.auth.signOut(); navigate({ to: "/auth" }); }

  return (
    <main className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      <header className="glass-gold rounded-3xl p-5 sm:p-6 fade-up grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[color:var(--gold-light)] inline-flex items-center gap-2"><Crown className="h-3 w-3" /> Super Admin</div>
          <h1 className="display gold-text text-2xl sm:text-3xl truncate">Control Center</h1>
          <p className="text-xs text-[color:var(--muted-foreground)] truncate">Signed in as {user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin" className="rounded-xl px-3 py-2 text-xs sm:text-sm border border-[color:var(--border)] inline-flex items-center gap-2 hover:bg-[oklch(0.78_0.14_82/10%)] transition"><Shield className="h-4 w-4" /><span className="hidden sm:inline">Admin</span></Link>
          <Link to="/downtime" className="rounded-xl px-3 py-2 text-xs sm:text-sm border border-[color:var(--border)] inline-flex items-center gap-2 hover:bg-[oklch(0.78_0.14_82/10%)] transition"><Wrench className="h-4 w-4" /><span className="hidden sm:inline">Downtime</span></Link>
          <Link to="/" className="rounded-xl px-3 py-2 text-xs sm:text-sm border border-[color:var(--border)] inline-flex items-center gap-2 hover:bg-[oklch(0.78_0.14_82/10%)] transition"><ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Dashboard</span></Link>
          <button onClick={signOut} className="btn-gold rounded-xl px-3 py-2 text-xs sm:text-sm inline-flex items-center gap-2"><LogOut className="h-4 w-4" /><span className="hidden sm:inline">Sign Out</span></button>
        </div>
      </header>

      <nav className="glass-gold rounded-2xl p-2 flex flex-wrap gap-1">
        {(["admins", "plant", "security", "audit"] as const).map((k) => (
          <button key={k} onClick={() => setTab(k)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${tab === k ? "bg-[oklch(0.78_0.14_82/25%)] text-[color:var(--gold-light)]" : "hover:bg-[oklch(0.78_0.14_82/10%)]"}`}>
            {k === "admins" ? "Admin Accounts" : k === "plant" ? "Plant Head" : k === "security" ? "Security" : "Audit Logs"}
          </button>
        ))}
      </nav>

      {tab === "admins" && <AdminsTab currentUserId={user!.id} />}
      {tab === "plant" && <PlantHeadTab />}
      {tab === "security" && <SecurityTab userEmail={user!.email ?? ""} userId={user!.id} />}
      {tab === "audit" && <AuditTab />}
    </main>
  );
}

function AdminsTab({ currentUserId }: { currentUserId: string }) {
  const list = useServerFn(listAdminUsers);
  const invite = useServerFn(inviteAdmin);
  const disable = useServerFn(setUserDisabled);
  const del = useServerFn(deleteAdmin);
  const setRole = useServerFn(setAdminRole);
  const saveAccess = useServerFn(updateUserAccess);
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [department, setDepartment] = useState<Department>("production");
  const [permissions, setPermissions] = useState<AccessOption[]>(["dashboard_view", "production_view"]);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try { const rows = await list(); setUsers(rows as AdminUser[]); }
    catch (e) { toast.error((e as Error).message); }
  }, [list]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await invite({ data: { email, username, department, permissions } }); toast.success("Invitation sent"); setEmail(""); setUsername(""); await refresh(); }
    catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }
  async function toggleDisabled(u: AdminUser) {
    const disabled = !(u.banned_until && new Date(u.banned_until) > new Date());
    try { await disable({ data: { userId: u.id, disabled } }); toast.success(disabled ? "Account disabled" : "Account enabled"); await refresh(); }
    catch (err) { toast.error((err as Error).message); }
  }
  async function handleDelete(u: AdminUser) {
    if (!confirm(`Delete ${u.email}? This removes the account permanently.`)) return;
    try { await del({ data: { userId: u.id } }); toast.success("Deleted"); await refresh(); }
    catch (err) { toast.error((err as Error).message); }
  }
  async function toggleRole(u: AdminUser) {
    const isA = u.roles.includes("admin");
    try { await setRole({ data: { userId: u.id, makeAdmin: !isA } }); toast.success(!isA ? "Granted admin" : "Revoked admin"); await refresh(); }
    catch (err) { toast.error((err as Error).message); }
  }
  async function handleAccessSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    try { await saveAccess({ data: { userId: editing.id, username, department, permissions } }); toast.success("Access updated"); setEditing(null); await refresh(); }
    catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }
  function beginEdit(u: AdminUser) { setEditing(u); setEmail(u.email); setUsername(u.username || u.email.split("@")[0]); setDepartment(u.department ?? "production"); setPermissions(u.permissions as AccessOption[]); }
  function togglePermission(value: AccessOption) { setPermissions((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); }

  return (
    <>
      <section className="glass-gold rounded-3xl p-5 sm:p-6 fade-up">
        <h2 className="display gold-text text-xl mb-4 inline-flex items-center gap-2"><UserPlus className="h-5 w-5" /> {editing ? "Edit Account" : "Invite User"}</h2>
        <form onSubmit={editing ? handleAccessSave : handleInvite} className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[240px]">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--gold-light)] mb-1.5">Email</div>
            <input type="email" required disabled={!!editing} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="team@company.com"
              className="w-full bg-[oklch(0.14_0.005_60/60%)] border border-[color:var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[color:var(--gold)]" />
          </label>
          <label className="flex-1 min-w-[180px]"><div className="text-[10px] uppercase tracking-widest text-[color:var(--gold-light)] mb-1.5">Username</div><input required minLength={2} maxLength={60} value={username} onChange={(e) => setUsername(e.target.value)} className="input w-full" /></label>
          <label className="min-w-[170px]"><div className="text-[10px] uppercase tracking-widest text-[color:var(--gold-light)] mb-1.5">Department</div><select value={department} onChange={(e) => setDepartment(e.target.value as Department)} className="input w-full"><option value="production">Production</option><option value="maintenance">Maintenance</option><option value="admin">Admin</option></select></label>
          <fieldset className="w-full"><legend className="text-xs text-[color:var(--gold-light)] mb-2">Permissions</legend><div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">{ACCESS_OPTIONS.map((permission) => <label key={permission} className="flex items-center gap-2 text-xs border border-[color:var(--border)] p-2 rounded"><input type="checkbox" checked={permissions.includes(permission)} onChange={() => togglePermission(permission)} />{permission.replaceAll("_", " ")}</label>)}</div></fieldset>
          <button disabled={busy} className="btn-gold rounded-xl px-5 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />} {editing ? "Save Access" : "Send Invite"}
          </button>
          {editing && <button type="button" onClick={() => { setEditing(null); setEmail(""); setUsername(""); }} className="text-sm border border-[color:var(--border)] rounded px-4 py-2">Cancel</button>}
        </form>
        <p className="text-xs text-[color:var(--muted-foreground)] mt-2">Invitees receive an email link. Department and permissions are assigned here, not at sign-in.</p>
      </section>

      <section className="glass-gold rounded-3xl p-5 sm:p-6 fade-up">
        <h2 className="display gold-text text-xl mb-4">All Users</h2>
        <div className="overflow-x-auto rounded-2xl border border-[oklch(0.78_0.14_82/20%)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[oklch(0.20_0.02_80/60%)] text-[color:var(--gold-light)] uppercase text-[10px] tracking-widest">
              <tr><th className="px-3 py-2.5 text-left">Account</th><th className="px-3 py-2.5 text-left">Department / Role</th><th className="px-3 py-2.5 text-left">Status</th><th className="px-3 py-2.5 text-left">Last Sign-in</th><th className="px-3 py-2.5 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {!users && <tr><td colSpan={5} className="p-6 text-center text-[color:var(--muted-foreground)]"><Loader2 className="h-4 w-4 animate-spin inline" /></td></tr>}
              {users?.map((u) => {
                const disabled = !!(u.banned_until && new Date(u.banned_until) > new Date());
                const isMe = u.id === currentUserId;
                return (
                  <tr key={u.id} className="border-t border-[oklch(0.78_0.14_82/15%)]">
                    <td className="px-3 py-2.5"><strong>{u.username || "—"}</strong><div className="text-xs text-[color:var(--muted-foreground)]">{u.email} {isMe && "(you)"}</div></td>
                    <td className="px-3 py-2.5">
                      {u.is_super_admin ? <span className="inline-flex items-center gap-1 text-[color:var(--gold-light)] font-bold"><Crown className="h-3 w-3" /> Super Admin</span>
                        : u.roles.includes("admin") ? <span className="text-[color:var(--gold)]">Admin</span>
                        : <span className="text-[color:var(--muted-foreground)]">User</span>}
                      <div className="text-xs capitalize text-[color:var(--muted-foreground)]">{u.department ?? "Unassigned"}</div>
                    </td>
                    <td className="px-3 py-2.5">{disabled ? <span className="text-destructive">Disabled</span> : <span className="text-[color:var(--success,oklch(0.72_0.18_145))]">Active</span>}</td>
                    <td className="px-3 py-2.5 text-xs text-[color:var(--muted-foreground)]">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex gap-1">
                        {!u.is_super_admin && <button onClick={() => beginEdit(u)} title="Edit department and permissions" className="rounded-lg p-1.5 hover:bg-[oklch(0.78_0.14_82/20%)]"><Save className="h-4 w-4" /></button>}
                        {!u.is_super_admin && (
                          <button onClick={() => toggleRole(u)} title={u.roles.includes("admin") ? "Revoke admin" : "Grant admin"} className="rounded-lg p-1.5 hover:bg-[oklch(0.78_0.14_82/20%)]">
                            {u.roles.includes("admin") ? <Shield className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                          </button>
                        )}
                        {!isMe && !u.is_super_admin && (
                          <button onClick={() => toggleDisabled(u)} title={disabled ? "Enable" : "Disable"} className="rounded-lg p-1.5 hover:bg-[oklch(0.78_0.14_82/20%)]"><Ban className="h-4 w-4" /></button>
                        )}
                        {!isMe && !u.is_super_admin && (
                          <button onClick={() => handleDelete(u)} title="Delete" className="rounded-lg p-1.5 hover:bg-[oklch(0.62_0.22_27/25%)] text-destructive"><Trash2 className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}

function PlantHeadTab() {
  const [row, setRow] = useState<Record<string, string> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("plant_head").select("*").limit(1).maybeSingle();
      if (data) setRow(data as unknown as Record<string, string>);
      else setRow({ full_name: "", employee_id: "", official_email: "", mobile_primary: "", mobile_alternate: "", designation: "Plant Head", department: "", status: "active" });
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!row) return; setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = { ...row, updated_by: userData.user?.id ?? null };
      const { error } = row.id
        ? await supabase.from("plant_head").update(payload).eq("id", row.id)
        : await supabase.from("plant_head").insert(payload);
      if (error) throw error;
      toast.success("Plant Head details saved");
    } catch (err) { toast.error((err as Error).message); } finally { setSaving(false); }
  }

  if (!row) return <div className="glass-gold rounded-3xl p-8 text-center"><Loader2 className="h-6 w-6 animate-spin inline text-[color:var(--gold)]" /></div>;

  const fields: [string, string, string?][] = [
    ["full_name", "Full Name"], ["employee_id", "Employee ID"],
    ["official_email", "Official Email", "email"], ["mobile_primary", "Mobile (Primary)", "tel"],
    ["mobile_alternate", "Mobile (Alternate)", "tel"], ["designation", "Designation"],
    ["department", "Department"], ["status", "Status"],
  ];

  return (
    <section className="glass-gold rounded-3xl p-5 sm:p-6 fade-up">
      <h2 className="display gold-text text-xl mb-4">Plant Head Details</h2>
      <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {fields.map(([k, label, type]) => (
          <label key={k} className="block">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--gold-light)] mb-1.5">{label}</div>
            <input type={type ?? "text"} value={row[k] ?? ""} onChange={(e) => setRow({ ...row, [k]: e.target.value })}
              className="w-full bg-[oklch(0.14_0.005_60/60%)] border border-[color:var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[color:var(--gold)]" />
          </label>
        ))}
        <div className="md:col-span-2 flex justify-end">
          <button disabled={saving} className="btn-gold rounded-xl px-5 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-60">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
          </button>
        </div>
      </form>
    </section>
  );
}

type AuditRow = { id: string; actor_email: string | null; action: string; entity: string; entity_id: string | null; details: unknown; created_at: string };

function AuditTab() {
  const [rows, setRows] = useState<AuditRow[] | null>(null);
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
      if (error) toast.error(error.message);
      setRows((data ?? []) as AuditRow[]);
    })();
  }, []);
  return (
    <section className="glass-gold rounded-3xl p-5 sm:p-6 fade-up">
      <h2 className="display gold-text text-xl mb-4">Audit Logs</h2>
      <div className="overflow-x-auto rounded-2xl border border-[oklch(0.78_0.14_82/20%)]">
        <table className="min-w-full text-sm">
          <thead className="bg-[oklch(0.20_0.02_80/60%)] text-[color:var(--gold-light)] uppercase text-[10px] tracking-widest">
            <tr><th className="px-3 py-2.5 text-left">When</th><th className="px-3 py-2.5 text-left">Actor</th><th className="px-3 py-2.5 text-left">Action</th><th className="px-3 py-2.5 text-left">Entity</th><th className="px-3 py-2.5 text-left">Details</th></tr>
          </thead>
          <tbody>
            {!rows && <tr><td colSpan={5} className="p-6 text-center"><Loader2 className="h-4 w-4 animate-spin inline" /></td></tr>}
            {rows?.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-[color:var(--muted-foreground)]">No audit entries yet.</td></tr>}
            {rows?.map((r) => (
              <tr key={r.id} className="border-t border-[oklch(0.78_0.14_82/15%)] align-top">
                <td className="px-3 py-2.5 text-xs whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</td>
                <td className="px-3 py-2.5 text-xs">{r.actor_email ?? "—"}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-[color:var(--gold-light)]">{r.action}</td>
                <td className="px-3 py-2.5 text-xs">{r.entity}{r.entity_id ? ` · ${r.entity_id.slice(0, 8)}` : ""}</td>
                <td className="px-3 py-2.5 text-xs"><pre className="max-w-md truncate opacity-70">{JSON.stringify(r.details)}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ---------------- Security Tab ----------------

type SecuritySettings = {
  user_id: string;
  two_factor_enabled: boolean;
  recovery_email: string | null;
  recovery_email_verified: boolean;
  pending_new_email: string | null;
};

function passwordIssues(pw: string): string[] {
  const issues: string[] = [];
  if (pw.length < 8) issues.push("At least 8 characters");
  if (!/[a-z]/.test(pw)) issues.push("One lowercase letter");
  if (!/[A-Z]/.test(pw)) issues.push("One uppercase letter");
  if (!/[0-9]/.test(pw)) issues.push("One number");
  if (!/[^A-Za-z0-9]/.test(pw)) issues.push("One special character");
  return issues;
}

function SecurityTab({ userEmail, userId }: { userEmail: string; userId: string }) {
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("security_settings").select("*").eq("user_id", userId).maybeSingle();
    if (error) toast.error(error.message);
    if (data) setSettings(data as SecuritySettings);
    else setSettings({ user_id: userId, two_factor_enabled: false, recovery_email: null, recovery_email_verified: false, pending_new_email: null });
    setLoading(false);
  }, [userId]);
  useEffect(() => { load(); }, [load]);

  async function upsert(patch: Partial<SecuritySettings>) {
    const next = { ...(settings ?? { user_id: userId, two_factor_enabled: false, recovery_email: null, recovery_email_verified: false, pending_new_email: null }), ...patch };
    const { error } = await supabase.from("security_settings").upsert(next, { onConflict: "user_id" });
    if (error) { toast.error(error.message); return false; }
    setSettings(next as SecuritySettings);
    return true;
  }

  if (loading || !settings) {
    return <div className="glass-gold rounded-3xl p-8 text-center"><Loader2 className="h-6 w-6 animate-spin inline text-[color:var(--gold)]" /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <ChangeEmailCard currentEmail={userEmail} pending={settings.pending_new_email} onQueued={(e) => upsert({ pending_new_email: e })} onCancel={() => upsert({ pending_new_email: null })} />
      <ChangePasswordCard />
      <TwoFactorCard enabled={settings.two_factor_enabled} onToggle={(v) => upsert({ two_factor_enabled: v })} />
      <RecoveryEmailCard recovery={settings.recovery_email} verified={settings.recovery_email_verified} onSave={(e) => upsert({ recovery_email: e, recovery_email_verified: false })} />
    </div>
  );
}

function OtpNotice() {
  return (
    <div className="mt-3 flex gap-2 items-start rounded-xl border border-[oklch(0.78_0.14_82/25%)] bg-[oklch(0.78_0.14_82/8%)] p-3 text-[11px] text-[color:var(--muted-foreground)]">
      <AlertTriangle className="h-3.5 w-3.5 mt-0.5 text-[color:var(--gold-light)] shrink-0" />
      <span>Email OTP verification will activate automatically once the email service is connected. Your request is saved and will resume the verification flow then.</span>
    </div>
  );
}

function ChangeEmailCard({ currentEmail, pending, onQueued, onCancel }: { currentEmail: string; pending: string | null; onQueued: (e: string) => Promise<boolean>; onCancel: () => Promise<boolean> }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim().toLowerCase() === currentEmail.toLowerCase()) { toast.error("New email is the same as current"); return; }
    setBusy(true);
    const ok = await onQueued(email.trim());
    setBusy(false);
    if (ok) { toast.success("Email change request saved (OTP pending)"); setEmail(""); }
  }
  return (
    <section className="glass-gold rounded-3xl p-5 sm:p-6 fade-up">
      <h3 className="display gold-text text-lg inline-flex items-center gap-2"><Mail className="h-5 w-5" /> Change Login Email</h3>
      <p className="text-[11px] text-[color:var(--muted-foreground)] mt-1">Requires double OTP verification (current + new address).</p>
      <div className="mt-4 space-y-1">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--gold-light)]">Current</div>
        <div className="text-sm font-mono">{currentEmail}</div>
      </div>
      {pending && (
        <div className="mt-3 rounded-xl border border-[oklch(0.78_0.14_82/30%)] bg-[oklch(0.20_0.02_80/40%)] p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--gold-light)]">Pending</div>
            <div className="text-sm font-mono truncate">{pending}</div>
          </div>
          <button onClick={() => onCancel()} className="text-xs rounded-lg px-3 py-1.5 border border-[color:var(--border)] hover:bg-destructive/10 text-destructive">Cancel</button>
        </div>
      )}
      <form onSubmit={submit} className="mt-3 flex flex-wrap items-end gap-2">
        <label className="flex-1 min-w-[200px]">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--gold-light)] mb-1.5">New Email</div>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="new@company.com"
            className="w-full bg-[oklch(0.14_0.005_60/60%)] border border-[color:var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[color:var(--gold)]" />
        </label>
        <button disabled={busy} className="btn-gold rounded-xl px-4 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Request
        </button>
      </form>
      <OtpNotice />
    </section>
  );
}

function ChangePasswordCard() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const issues = passwordIssues(next);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (issues.length) { toast.error("Password does not meet requirements"); return; }
    if (next !== confirm) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      const email = u.user?.email;
      if (!email) throw new Error("No session");
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: current });
      if (signInErr) throw new Error("Current password is incorrect");
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) throw error;
      toast.success("Password updated");
      setCurrent(""); setNext(""); setConfirm("");
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <section className="glass-gold rounded-3xl p-5 sm:p-6 fade-up">
      <h3 className="display gold-text text-lg inline-flex items-center gap-2"><KeyRound className="h-5 w-5" /> Change Password</h3>
      <p className="text-[11px] text-[color:var(--muted-foreground)] mt-1">Min 8 chars, mixed case, number, special character.</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        {[
          { label: "Current Password", val: current, set: setCurrent },
          { label: "New Password", val: next, set: setNext },
          { label: "Confirm New Password", val: confirm, set: setConfirm },
        ].map((f) => (
          <label key={f.label} className="block">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--gold-light)] mb-1.5">{f.label}</div>
            <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[oklch(0.14_0.005_60/60%)] px-3 py-2.5">
              <Lock className="h-4 w-4 text-[color:var(--muted-foreground)]" />
              <input type={show ? "text" : "password"} required value={f.val} onChange={(e) => f.set(e.target.value)}
                className="w-full bg-transparent outline-none text-sm" />
              {f.label === "New Password" && (
                <button type="button" onClick={() => setShow(!show)} className="text-[color:var(--muted-foreground)] hover:text-[color:var(--gold)]">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            </div>
          </label>
        ))}
        {next && (
          <ul className="text-[11px] space-y-0.5">
            {["At least 8 characters", "One lowercase letter", "One uppercase letter", "One number", "One special character"].map((r) => {
              const ok = !issues.includes(r);
              return (
                <li key={r} className={`flex items-center gap-1.5 ${ok ? "text-[color:var(--success,oklch(0.72_0.18_145))]" : "text-[color:var(--muted-foreground)]"}`}>
                  <CheckCircle2 className="h-3 w-3" /> {r}
                </li>
              );
            })}
          </ul>
        )}
        <button disabled={busy} className="btn-gold w-full rounded-xl py-2.5 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Update Password
        </button>
      </form>
    </section>
  );
}

function TwoFactorCard({ enabled, onToggle }: { enabled: boolean; onToggle: (v: boolean) => Promise<boolean> }) {
  const [busy, setBusy] = useState(false);
  async function flip() {
    setBusy(true);
    const ok = await onToggle(!enabled);
    setBusy(false);
    if (ok) toast.success(!enabled ? "2FA enabled (activates when email service is live)" : "2FA disabled");
  }
  return (
    <section className="glass-gold rounded-3xl p-5 sm:p-6 fade-up">
      <h3 className="display gold-text text-lg inline-flex items-center gap-2"><Smartphone className="h-5 w-5" /> Two-Factor Authentication</h3>
      <p className="text-[11px] text-[color:var(--muted-foreground)] mt-1">When enabled, Super Admin login requires an Email OTP after password.</p>
      <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border border-[oklch(0.78_0.14_82/25%)] bg-[oklch(0.20_0.02_80/40%)] p-4">
        <div>
          <div className="text-sm font-bold">Email OTP for Super Admin</div>
          <div className={`text-xs mt-0.5 ${enabled ? "text-[color:var(--success,oklch(0.72_0.18_145))]" : "text-[color:var(--muted-foreground)]"}`}>
            {enabled ? "Enabled" : "Disabled"}
          </div>
        </div>
        <button onClick={flip} disabled={busy}
          className={`relative w-14 h-8 rounded-full transition ${enabled ? "bg-[oklch(0.78_0.14_82)]" : "bg-[oklch(0.30_0.02_60)]"} disabled:opacity-60`}>
          <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${enabled ? "left-7" : "left-1"}`} />
        </button>
      </div>
      <OtpNotice />
    </section>
  );
}

function RecoveryEmailCard({ recovery, verified, onSave }: { recovery: string | null; verified: boolean; onSave: (e: string) => Promise<boolean> }) {
  const [email, setEmail] = useState(recovery ?? "");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setEmail(recovery ?? ""); }, [recovery]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const ok = await onSave(email.trim());
    setBusy(false);
    if (ok) toast.success("Recovery email saved (OTP verification pending)");
  }
  return (
    <section className="glass-gold rounded-3xl p-5 sm:p-6 fade-up">
      <h3 className="display gold-text text-lg inline-flex items-center gap-2"><LifeBuoy className="h-5 w-5" /> Recovery Email</h3>
      <p className="text-[11px] text-[color:var(--muted-foreground)] mt-1">Used to regain access. Requires OTP verification on both old and new addresses.</p>
      {recovery && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-[color:var(--muted-foreground)]">Current:</span>
          <span className="font-mono">{recovery}</span>
          {verified
            ? <span className="text-[color:var(--success,oklch(0.72_0.18_145))] inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Verified</span>
            : <span className="text-[color:var(--gold-light)] inline-flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> Unverified</span>}
        </div>
      )}
      <form onSubmit={submit} className="mt-4 flex flex-wrap items-end gap-2">
        <label className="flex-1 min-w-[200px]">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--gold-light)] mb-1.5">Recovery Email</div>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="backup@personal.com"
            className="w-full bg-[oklch(0.14_0.005_60/60%)] border border-[color:var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[color:var(--gold)]" />
        </label>
        <button disabled={busy} className="btn-gold rounded-xl px-4 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
        </button>
      </form>
      <OtpNotice />
    </section>
  );
}
