import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthUser, useProductionEntries } from "@/hooks/useProduction";
import { ALL_SHIFTS, SHIFTS, toDateStr, businessDate, type ProductionEntry, type ShiftNum } from "@/lib/production";
import { toast } from "sonner";
import { ProductionModeControl } from "@/components/dashboard/ProductionModeControl";
import { useProductionMode } from "@/hooks/useProductionMode";
import { ArrowLeft, LogOut, Plus, Pencil, Trash2, Save, X, Search, Filter, Loader2, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Panel · Phorotech Production" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPanel,
});

interface FormState {
  id?: string;
  entry_date: string;
  shift: ShiftNum;
  slot_index: number;
  load_count: number;
  remarks: string;
}

const newForm = (): FormState => ({
  entry_date: businessDate(),
  shift: 1,
  slot_index: 0,
  load_count: 0,
  remarks: "",
});

function AdminPanel() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuthUser();
  const { entries, loading } = useProductionEntries();
  const { mode } = useProductionMode();
  const [form, setForm] = useState<FormState>(newForm());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterShift, setFilterShift] = useState<"all" | ShiftNum>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setForm((f) => ({ ...f, slot_index: 0 }));
  }, [form.shift]);

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      if (search && !e.entry_date.includes(search)) return false;
      if (filterShift !== "all" && e.shift !== filterShift) return false;
      return true;
    });
  }, [entries, search, filterShift]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        entry_date: form.entry_date,
        shift: form.shift,
        slot_index: form.slot_index,
        time_slot: SHIFTS[form.shift].slots[form.slot_index],
        load_count: Number(form.load_count) || 0,
        remarks: form.remarks || null,
      };
      if (form.id) {
        const { error } = await supabase.from("production_entries").update(payload).eq("id", form.id);
        if (error) throw error;
        toast.success("Entry updated");
      } else {
        // Upsert on (date, shift, slot_index) — duplicate becomes edit.
        const { data: existing } = await supabase
          .from("production_entries")
          .select("id")
          .eq("entry_date", payload.entry_date)
          .eq("shift", payload.shift)
          .eq("slot_index", payload.slot_index)
          .maybeSingle();
        if (existing?.id) {
          const { error } = await supabase.from("production_entries").update(payload).eq("id", existing.id);
          if (error) throw error;
          toast.success("Existing slot updated");
        } else {
          const { error } = await supabase.from("production_entries").insert(payload);
          if (error) throw error;
          toast.success("Entry saved");
        }
      }
      setForm(newForm());
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const { error } = await supabase.from("production_entries").delete().eq("id", id);
      if (error) throw error;
      toast.success("Deleted");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(e: ProductionEntry) {
    setForm({
      id: e.id,
      entry_date: e.entry_date,
      shift: e.shift,
      slot_index: e.slot_index,
      load_count: e.load_count,
      remarks: e.remarks ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  if (user === undefined) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="h-8 w-8 animate-spin text-[color:var(--gold)]" /></div>;
  }

  if (user && !isAdmin) {
    return (
      <main className="relative z-10 min-h-screen grid place-items-center px-4">
        <div className="glass-gold max-w-md rounded-3xl p-8 text-center">
          <ShieldAlert className="h-10 w-10 mx-auto text-[color:var(--gold-light)]" />
          <h1 className="display gold-text text-2xl mt-3">Not authorized</h1>
          <p className="text-sm text-[color:var(--muted-foreground)] mt-2">Your account exists but is not an admin. Ask a system admin to grant access.</p>
          <button onClick={signOut} className="btn-gold rounded-xl mt-6 px-4 py-2 text-sm">Sign out</button>
        </div>
      </main>
    );
  }

  return (
    <main className="relative z-10 mx-auto max-w-7xl px-3 sm:px-6 py-4 sm:py-6 space-y-5">
      <header className="glass-gold rounded-3xl p-5 sm:p-6 fade-up grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[color:var(--gold-light)]">Production Admin</div>
          <h1 className="display gold-text text-2xl sm:text-3xl truncate">Phorotech ED Plant</h1>
          <p className="text-xs text-[color:var(--muted-foreground)] truncate">Signed in as {user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/" className="rounded-xl px-3 py-2 text-xs sm:text-sm border border-[color:var(--border)] inline-flex items-center gap-2 hover:bg-[oklch(0.78_0.14_82/10%)] transition">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <button onClick={signOut} className="btn-gold rounded-xl px-3 py-2 text-xs sm:text-sm inline-flex items-center gap-2">
            <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      <ProductionModeControl canManage={isAdmin} />

      <section className="glass-gold rounded-3xl p-5 sm:p-6 fade-up">
        <h2 className="display gold-text text-xl mb-4 flex items-center gap-2">
          {form.id ? <><Pencil className="h-5 w-5" /> Edit Entry</> : <><Plus className="h-5 w-5" /> New Entry</>}
        </h2>
        {mode === "AUTO" && (
          <div className="mb-4 rounded-2xl border border-[color:var(--cyan)] bg-[oklch(0.7_0.15_200/10%)] px-4 py-3 text-sm text-[color:var(--cyan)] font-bold">
            System is in AUTO MODE — manual entry is disabled. Production is recorded automatically by the ESP32 device.
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
          <FormField label="Date" className="lg:col-span-1">
            <input type="date" required value={form.entry_date} onChange={(e) => setForm({ ...form, entry_date: e.target.value })} max={toDateStr(new Date())} className="input" />
          </FormField>
          <FormField label="Shift" className="lg:col-span-1">
            <select required value={form.shift} onChange={(e) => setForm({ ...form, shift: Number(e.target.value) as ShiftNum })} className="input">
              {ALL_SHIFTS.map((s) => (<option key={s} value={s}>{SHIFTS[s].label}</option>))}
            </select>
          </FormField>
          <FormField label="Time Slot" className="lg:col-span-1">
            <select required value={form.slot_index} onChange={(e) => setForm({ ...form, slot_index: Number(e.target.value) })} className="input">
              {SHIFTS[form.shift].slots.map((s, i) => (<option key={i} value={i}>{s}</option>))}
            </select>
          </FormField>
          <FormField label="Load Count" className="lg:col-span-1">
            <input type="number" min={0} max={9999} required value={form.load_count}
              onChange={(e) => setForm({ ...form, load_count: Number(e.target.value) })} className="input" />
          </FormField>
          <FormField label="Remarks (optional)" className="lg:col-span-2">
            <input type="text" maxLength={200} value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })} className="input" placeholder="Notes…" />
          </FormField>
          <div className="lg:col-span-6 flex flex-wrap gap-2 justify-end">
            {form.id && (
              <button type="button" onClick={() => setForm(newForm())} className="rounded-xl border border-[color:var(--border)] px-4 py-2.5 text-sm inline-flex items-center gap-2 hover:bg-[oklch(0.78_0.14_82/10%)]">
                <X className="h-4 w-4" /> Cancel
              </button>
            )}
            <button disabled={saving || mode === "AUTO"} className="btn-gold rounded-xl px-5 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {form.id ? "Update Entry" : "Save Entry"}
            </button>
          </div>
        </form>
      </section>

      <section className="glass-gold rounded-3xl p-5 sm:p-6 fade-up">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <h2 className="display gold-text text-xl">Entry History</h2>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[oklch(0.14_0.005_60/60%)] px-3 py-2">
              <Search className="h-4 w-4 text-[color:var(--muted-foreground)]" />
              <input type="search" placeholder="Filter date (YYYY-MM-DD)" value={search} onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent outline-none text-xs sm:text-sm w-44" />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[oklch(0.14_0.005_60/60%)] px-3 py-2">
              <Filter className="h-4 w-4 text-[color:var(--muted-foreground)]" />
              <select value={filterShift} onChange={(e) => setFilterShift(e.target.value === "all" ? "all" : Number(e.target.value) as ShiftNum)}
                className="bg-transparent outline-none text-xs sm:text-sm">
                <option value="all">All shifts</option>
                {ALL_SHIFTS.map((s) => (<option key={s} value={s}>{SHIFTS[s].label}</option>))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[oklch(0.78_0.14_82/20%)]">
          <table className="min-w-full text-sm">
            <thead className="bg-[oklch(0.20_0.02_80/60%)] text-[color:var(--gold-light)] uppercase text-[10px] tracking-widest">
              <tr>
                <Th>Date</Th><Th>Shift</Th><Th>Slot</Th><Th className="text-right">Loads</Th><Th>Remarks</Th><Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (<tr><td colSpan={6} className="p-6 text-center text-[color:var(--muted-foreground)]">Loading…</td></tr>)}
              {!loading && filtered.length === 0 && (<tr><td colSpan={6} className="p-6 text-center text-[color:var(--muted-foreground)]">No entries yet.</td></tr>)}
              {filtered.map((e) => (
                <tr key={e.id} className="border-t border-[oklch(0.78_0.14_82/15%)] hover:bg-[oklch(0.78_0.14_82/8%)] transition">
                  <Td>{e.entry_date}</Td>
                  <Td>{SHIFTS[e.shift].label}</Td>
                  <Td className="font-mono">{e.time_slot}</Td>
                  <Td className="text-right gold-text font-semibold">{e.load_count}</Td>
                  <Td className="truncate max-w-[200px]">{e.remarks ?? "—"}</Td>
                  <Td className="text-right">
                    <div className="inline-flex gap-2">
                      <button onClick={() => startEdit(e)} className="rounded-lg p-1.5 hover:bg-[oklch(0.78_0.14_82/20%)] transition" title="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => { if (confirm("Delete this entry?")) handleDelete(e.id); }}
                        disabled={deletingId === e.id}
                        className="rounded-lg p-1.5 hover:bg-[oklch(0.62_0.22_27/25%)] text-destructive transition" title="Delete">
                        {deletingId === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`
        .input { width: 100%; background: oklch(0.14 0.005 60 / 60%); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 0.65rem 0.75rem; font-size: 0.875rem; color: var(--color-foreground); outline: none; transition: border-color .2s; }
        .input:focus { border-color: var(--gold); }
        select.input option { background: #0B0B0B; color: #FFD700; }
      `}</style>
    </main>
  );
}

function FormField({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--gold-light)] mb-1.5">{label}</div>
      {children}
    </label>
  );
}
function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-3 py-2.5 text-left font-semibold ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 ${className}`}>{children}</td>;
}
