import { useState } from "react";
import { toast } from "sonner";
import { Cpu, Hand, Loader2, AlertTriangle } from "lucide-react";
import { useProductionMode, type ProductionMode } from "@/hooks/useProductionMode";

export function ProductionModeBadge({ mode }: { mode: ProductionMode | null }) {
  if (!mode) return null;
  const auto = mode === "AUTO";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs sm:text-sm font-black tracking-wider border ${
        auto
          ? "text-[color:var(--cyan)] border-[color:var(--cyan)] bg-[oklch(0.7_0.15_200/10%)]"
          : "text-[color:var(--gold-light)] border-[oklch(0.78_0.14_82/40%)] bg-[oklch(0.78_0.14_82/10%)]"
      }`}
    >
      {auto ? <Cpu className="h-4 w-4" /> : <Hand className="h-4 w-4" />}
      {auto ? "AUTO MODE" : "MANUAL MODE"}
    </span>
  );
}

/** Admin-only control for the global production mode. */
export function ProductionModeControl({ canManage }: { canManage: boolean }) {
  const { mode, loading, setProductionMode } = useProductionMode();
  const [confirming, setConfirming] = useState<ProductionMode | null>(null);
  const [saving, setSaving] = useState(false);

  async function apply(next: ProductionMode) {
    setSaving(true);
    try {
      await setProductionMode(next);
      toast.success(`Production mode set to ${next} MODE`);
      setConfirming(null);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="glass-gold rounded-3xl p-5 sm:p-6 fade-up">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="display gold-text text-xl">Production Mode</h2>
          <p className="text-xs text-[color:var(--muted-foreground)] mt-1">
            Plant-wide setting. AUTO = network updates only. MANUAL = admin entry only.
          </p>
        </div>
        {loading ? <Loader2 className="h-5 w-5 animate-spin text-[color:var(--gold)]" /> : <ProductionModeBadge mode={mode} />}
      </div>

      {canManage && mode && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            disabled={mode === "MANUAL" || saving}
            onClick={() => setConfirming("MANUAL")}
            className="btn-outline-gold rounded-xl px-4 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-40"
          >
            <Hand className="h-4 w-4" /> Switch to MANUAL
          </button>
          <button
            disabled={mode === "AUTO" || saving}
            onClick={() => setConfirming("AUTO")}
            className="btn-gold rounded-xl px-4 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-40"
          >
            <Cpu className="h-4 w-4" /> Switch to AUTO
          </button>
        </div>
      )}

      {confirming && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true">
          <div className="glass-gold rounded-3xl p-6 max-w-md w-full">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-[color:var(--warning,orange)] shrink-0" />
              <div className="min-w-0">
                <h3 className="display gold-text text-lg">Switch to {confirming} MODE?</h3>
                <p className="text-sm text-[color:var(--muted-foreground)] mt-2">
                  {confirming === "AUTO"
                     ? "Manual production entry will be disabled for all admins, and network updates will become active."
                     : "Network updates will be disabled, and manual production entry will become active for admins."}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setConfirming(null)}
                className="rounded-xl border border-[color:var(--border)] px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={() => apply(confirming)}
                className="btn-gold rounded-xl px-4 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Confirm {confirming} MODE
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
