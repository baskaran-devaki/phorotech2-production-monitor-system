import { SHIFTS, sumLoads, type ProductionEntry, type ShiftNum, currentShift } from "@/lib/production";
import { Clock } from "lucide-react";

export function ShiftCard({ shift, entries, businessDate }: { shift: ShiftNum; entries: ProductionEntry[]; businessDate: string }) {
  const cfg = SHIFTS[shift];
  const dayShiftEntries = entries.filter((e) => e.entry_date === businessDate && e.shift === shift);
  const total = sumLoads(dayShiftEntries);
  const isActive = currentShift() === shift;

  return (
    <div className={`glass-gold rounded-3xl p-5 md:p-6 fade-up ${isActive ? "gold-glow" : ""}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-[color:var(--gold-light)]" />
            <h3 className="display text-xl md:text-2xl gold-text">{cfg.label}</h3>
            {isActive && (
              <span className="text-[10px] uppercase tracking-widest rounded-full bg-[oklch(0.78_0.14_82/25%)] px-2 py-0.5 text-[color:var(--gold-light)] border border-[oklch(0.78_0.14_82/40%)]">Live</span>
            )}
          </div>
          <p className="text-xs md:text-sm text-[color:var(--muted-foreground)] mt-0.5">{cfg.range}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--muted-foreground)]">Total</div>
          <div className="display gold-text text-3xl md:text-4xl font-bold">{total}</div>
        </div>
      </div>

      <div className="mt-4 divide-y divide-[oklch(0.78_0.14_82/15%)] rounded-xl overflow-hidden border border-[oklch(0.78_0.14_82/15%)]">
        {cfg.slots.map((slot, idx) => {
          const entry = dayShiftEntries.find((e) => e.slot_index === idx);
          const count = entry?.load_count ?? 0;
          return (
            <div key={idx} className="grid grid-cols-[1fr_auto] items-center px-3 py-2 hover:bg-[oklch(0.78_0.14_82/8%)] transition-colors">
              <div className="text-xs md:text-sm font-mono text-[color:var(--foreground)]">{slot}</div>
              <div className={`text-sm md:text-base font-semibold ${count > 0 ? "gold-text" : "text-[color:var(--muted-foreground)]"}`}>
                {count}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
