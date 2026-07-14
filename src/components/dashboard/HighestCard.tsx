import { formatDMY, type HighestRecord } from "@/lib/production";
import { Award } from "lucide-react";

export function HighestCard({ record }: { record: HighestRecord }) {
  return (
    <section className="glass-gold rounded-3xl p-7 md:p-9 fade-up gold-glow">
      <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-5">
        <div className="hidden sm:grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.88_0.16_90)] to-[oklch(0.58_0.12_70)]">
          <Award className="h-8 w-8 text-[#0A0A0A]" />
        </div>
        <div className="min-w-0">
          <div className="text-xs md:text-sm uppercase tracking-[0.4em] text-[color:var(--cyan)] font-bold">Highest Production</div>
          <div className="mt-2 font-[family-name:var(--font-mono)] text-2xl md:text-4xl font-bold text-white truncate">
            {record.date ? formatDMY(record.date) : "—"}
          </div>
          <div className="text-sm text-[color:var(--muted-foreground)] mt-1">
            {record.date ? "Best day this month" : "No entries yet this month"}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs uppercase tracking-widest text-[color:var(--muted-foreground)] font-semibold">Loads</div>
          <div className="font-[family-name:var(--font-mono)] gold-text text-5xl md:text-7xl font-extrabold">
            {record.dailyTotal}
          </div>
        </div>
      </div>
    </section>
  );
}
