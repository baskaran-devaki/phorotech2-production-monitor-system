import { useEffect, useState } from "react";
import { SHIFTS, SHIFT_TARGET, sumLoads, type ProductionEntry, type ShiftNum, currentShift } from "@/lib/production";
import { Clock } from "lucide-react";

export function ShiftCard({ shift, entries, businessDate }: { shift: ShiftNum; entries: ProductionEntry[]; businessDate: string }) {
  const cfg = SHIFTS[shift];
  const dayShiftEntries = entries.filter((e) => e.entry_date === businessDate && e.shift === shift);
  const total = sumLoads(dayShiftEntries);
  const [isActive, setIsActive] = useState(false);
  useEffect(() => {
    const check = () => setIsActive(currentShift() === shift);
    check();
    const t = setInterval(check, 30_000);
    return () => clearInterval(t);
  }, [shift]);

  return (
    <div className={`glass-gold rounded-3xl p-6 md:p-7 fade-up ${isActive ? "gold-glow" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Clock className="h-5 w-5 text-[color:var(--cyan)]" />
            <h3 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-extrabold text-white">{cfg.label}</h3>
            {isActive && (
              <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-widest rounded-full bg-[oklch(0.72_0.19_145/15%)] px-2.5 py-0.5 text-[color:var(--success)] border border-[color:var(--success)]/40 font-bold">
                <span className="h-2 w-2 rounded-full bg-[color:var(--success)] pulse-green" /> Live
              </span>
            )}
          </div>
          <p className="text-sm md:text-base font-mono text-[color:var(--muted-foreground)] mt-1">{cfg.range}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs uppercase tracking-widest text-[color:var(--muted-foreground)] font-semibold">Total</div>
          <div className="font-[family-name:var(--font-mono)] gold-text text-4xl md:text-5xl font-extrabold">{total}</div>
          <div className="text-xs text-white/50 font-mono mt-0.5">/ {SHIFT_TARGET}</div>
        </div>
      </div>

      <div className="mt-5 divide-y divide-[oklch(0.78_0.14_82/15%)] rounded-xl overflow-hidden border border-[oklch(0.78_0.14_82/15%)]">
        {cfg.slots.map((slot, idx) => {
          const entry = dayShiftEntries.find((e) => e.slot_index === idx);
          const count = entry?.load_count ?? 0;
          return (
            <div key={idx} className="grid grid-cols-[1fr_auto] items-center px-4 py-2.5 hover:bg-[oklch(0.78_0.14_82/8%)] transition-colors">
              <div className="text-sm md:text-base font-mono text-[color:var(--foreground)]">{slot}</div>
              <div className={`text-base md:text-lg font-bold ${count > 0 ? "gold-text" : "text-[color:var(--muted-foreground)]"}`}>
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
