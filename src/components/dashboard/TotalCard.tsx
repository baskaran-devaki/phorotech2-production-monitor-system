import { AnimatedNumber } from "./AnimatedNumber";
import { TrendingUp } from "lucide-react";

export function TotalCard({ total, month }: { total: number; month: string }) {
  return (
    <section className="relative fade-up" style={{ animationDelay: "80ms" }}>
      <div className="glass-gold rounded-[2rem] p-10 md:p-14 relative overflow-hidden pulse-gold">
        <div className="absolute inset-0 shimmer opacity-40 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 border border-[color:var(--cyan)]/40 bg-[oklch(0.82_0.15_200/8%)]">
            <TrendingUp className="h-4 w-4 text-[color:var(--cyan)]" />
            <span className="text-sm uppercase tracking-[0.4em] text-[color:var(--cyan)] font-bold">Total No. of Loads</span>
          </div>
          <div className="mt-2 text-white/80 text-base md:text-lg font-semibold font-[family-name:var(--font-sans)]">{month}</div>
          <AnimatedNumber
            value={total}
            className="font-[family-name:var(--font-mono)] gold-text text-8xl sm:text-9xl md:text-[13rem] leading-none font-extrabold tracking-tight count-in"
          />
          <div className="text-sm sm:text-base text-white/70 tracking-[0.35em] uppercase font-bold">Monthly Production</div>
        </div>
      </div>
    </section>
  );
}
