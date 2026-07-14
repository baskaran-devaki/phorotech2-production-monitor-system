import { formatDMY, type HighestRecord } from "@/lib/production";
import { Award } from "lucide-react";

export function HighestCard({ record }: { record: HighestRecord }) {
  return (
    <section className="glass-gold rounded-3xl p-6 md:p-8 fade-up gold-glow">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4">
        <div className="hidden sm:grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.88_0.16_90)] to-[oklch(0.58_0.12_70)]">
          <Award className="h-7 w-7 text-[#0A0A0A]" />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] uppercase tracking-[0.4em] text-[color:var(--cyan)]">Highest Production</div>
          <div className="mt-2 font-[family-name:var(--font-mono)] text-2xl md:text-3xl text-white truncate">
            {record.date ? formatDMY(record.date) : "—"}
          </div>
          <div className="text-xs text-[color:var(--muted-foreground)] mt-1">
            {record.date ? "Best day this month" : "No entries yet this month"}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--muted-foreground)]">Loads</div>
          <div className="font-[family-name:var(--font-mono)] gold-text text-4xl md:text-6xl font-bold">
            {record.dailyTotal}
          </div>
        </div>
      </div>
    </section>
  );
}
