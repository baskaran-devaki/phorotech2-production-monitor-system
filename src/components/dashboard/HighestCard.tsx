import { SHIFTS, formatIndianDate, type HighestRecord } from "@/lib/production";
import { Award } from "lucide-react";

export function HighestCard({ record }: { record: HighestRecord }) {
  return (
    <section className="glass-gold rounded-3xl p-6 md:p-8 fade-up gold-glow">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
        <div className="hidden sm:grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.88_0.16_90)] to-[oklch(0.58_0.12_70)]">
          <Award className="h-7 w-7 text-[oklch(0.12_0.005_60)]" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[color:var(--gold-light)]">Highest Production</div>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="display text-2xl md:text-3xl gold-text truncate">{formatIndianDate(record.date)}</span>
            {record.shift && (
              <span className="text-sm md:text-base text-[color:var(--foreground)]">{SHIFTS[record.shift].label}</span>
            )}
          </div>
          <div className="text-xs text-[color:var(--muted-foreground)] mt-0.5">
            {record.date ? `Daily total ${record.dailyTotal} loads · Peak shift ${record.loads} loads` : "No entries yet this month"}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--muted-foreground)]">Loads</div>
          <div className="display gold-text text-4xl md:text-5xl font-bold">{record.loads}</div>
        </div>
      </div>
    </section>
  );
}
