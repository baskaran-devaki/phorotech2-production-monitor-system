import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser } from "@/hooks/useProduction";
import { toast } from "sonner";
import { ArrowLeft, LogOut, Loader2, ShieldAlert, UserPlus, Ban, Trash2, ShieldCheck, Shield, Save, Crown, Mail, KeyRound, Smartphone, LifeBuoy, Eye, EyeOff, CheckCircle2, AlertTriangle, Lock } from "lucide-react";
import {
  listAdminUsers, inviteAdmin, setUserDisabled, deleteAdmin, setAdminRole,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/super")({
  head: () => ({ meta: [{ title: "Super Admin · Phorotech" }, { name: "robots", content: "noindex" }] }),
  component: SuperAdminPanel,
});

type Tab = "admins" | "plant" | "security" | "audit";
type AdminUser = { id: string; email: string; created_at: string; last_sign_in_at: string | null; banned_until: string | null; roles: string[]; is_super_admin: boolean };

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
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try { const rows = await list(); setUsers(rows as AdminUser[]); }
    catch (e) { toast.error((e as Error).message); }
  }, [list]);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try { await invite({ data: { email } }); toast.success("Invitation sent"); setEmail(""); await refresh(); }
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

  return (
    <>
      <section className="glass-gold rounded-3xl p-5 sm:p-6 fade-up">
        <h2 className="display gold-text text-xl mb-4 inline-flex items-center gap-2"><UserPlus className="h-5 w-5" /> Invite Admin</h2>
        <form onSubmit={handleInvite} className="flex flex-wrap items-end gap-3">
          <label className="flex-1 min-w-[240px]">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--gold-light)] mb-1.5">Email</div>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="new-admin@company.com"
              className="w-full bg-[oklch(0.14_0.005_60/60%)] border border-[color:var(--border)] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[color:var(--gold)]" />
          </label>
          <button disabled={busy} className="btn-gold rounded-xl px-5 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />} Send Invite
          </button>
        </form>
        <p className="text-xs text-[color:var(--muted-foreground)] mt-2">The user receives an email link. On signup they are granted Admin access automatically.</p>
      </section>

      <section className="glass-gold rounded-3xl p-5 sm:p-6 fade-up">
        <h2 className="display gold-text text-xl mb-4">All Users</h2>
        <div className="overflow-x-auto rounded-2xl border border-[oklch(0.78_0.14_82/20%)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[oklch(0.20_0.02_80/60%)] text-[color:var(--gold-light)] uppercase text-[10px] tracking-widest">
              <tr><th className="px-3 py-2.5 text-left">Email</th><th className="px-3 py-2.5 text-left">Role</th><th className="px-3 py-2.5 text-left">Status</th><th className="px-3 py-2.5 text-left">Last Sign-in</th><th className="px-3 py-2.5 text-right">Actions</th></tr>
            </thead>
            <tbody>
              {!users && <tr><td colSpan={5} className="p-6 text-center text-[color:var(--muted-foreground)]"><Loader2 className="h-4 w-4 animate-spin inline" /></td></tr>}
              {users?.map((u) => {
                const disabled = !!(u.banned_until && new Date(u.banned_until) > new Date());
                const isMe = u.id === currentUserId;
                return (
                  <tr key={u.id} className="border-t border-[oklch(0.78_0.14_82/15%)]">
                    <td className="px-3 py-2.5">{u.email} {isMe && <span className="text-[10px] text-[color:var(--gold-light)]">(you)</span>}</td>
                    <td className="px-3 py-2.5">
                      {u.is_super_admin ? <span className="inline-flex items-center gap-1 text-[color:var(--gold-light)] font-bold"><Crown className="h-3 w-3" /> Super Admin</span>
                        : u.roles.includes("admin") ? <span className="text-[color:var(--gold)]">Admin</span>
                        : <span className="text-[color:var(--muted-foreground)]">User</span>}
                    </td>
                    <td className="px-3 py-2.5">{disabled ? <span className="text-destructive">Disabled</span> : <span className="text-[color:var(--success,oklch(0.72_0.18_145))]">Active</span>}</td>
                    <td className="px-3 py-2.5 text-xs text-[color:var(--muted-foreground)]">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "—"}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="inline-flex gap-1">
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
