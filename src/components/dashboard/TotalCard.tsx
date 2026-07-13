import { AnimatedNumber } from "./AnimatedNumber";
import { TrendingUp } from "lucide-react";

export function TotalCard({ total, month }: { total: number; month: string }) {
  return (
    <section className="relative fade-up" style={{ animationDelay: "80ms" }}>
      <div className="glass-gold rounded-[2rem] p-8 md:p-12 relative overflow-hidden pulse-gold">
        <div className="absolute inset-0 shimmer opacity-40 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 border border-[oklch(0.78_0.14_82/40%)] bg-[oklch(0.12_0.005_60/60%)]">
            <TrendingUp className="h-3.5 w-3.5 text-[color:var(--gold-light)]" />
            <span className="text-[11px] uppercase tracking-[0.4em] text-[color:var(--gold-light)]">Total No. of Loads</span>
          </div>
          <div className="mt-2 text-[color:var(--muted-foreground)] text-sm">{month}</div>
          <AnimatedNumber
            value={total}
            className="display gold-text text-7xl sm:text-8xl md:text-[11rem] leading-none font-bold tracking-tight count-in"
          />
          <div className="text-xs sm:text-sm text-[color:var(--muted-foreground)] tracking-wider">MONTHLY PRODUCTION</div>
        </div>
      </div>
    </section>
  );
}
