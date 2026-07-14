import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useProductionEntries } from "@/hooks/useProduction";
import {
  ALL_SHIFTS, DAILY_TARGET, MONTHLY_TARGET, SHIFTS, SHIFT_TARGET,
  businessDate, celebratedDays, currentMonthKey, currentShift, formatDMY,
  highestOfMonth, lastCompletedHour, lastDayTotal, monthName, monthNameFromKey,
  previousMonthKey, sumLoads, totalForMonth,
} from "@/lib/production";
import logoAsset from "@/assets/phorotech-logo.jpg.asset.json";

export const Route = createFileRoute("/tv")({
  ssr: false,
  component: TvDisplay,
  head: () => ({ meta: [{ title: "Phorotech TV Display · Live Production" }] }),
});

function TvDisplay() {
  const { entries } = useProductionEntries();
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const mKey = currentMonthKey(now);
  const bDate = businessDate(now);
  const shift = currentShift(now);

  const monthlyActual = useMemo(() => totalForMonth(entries, mKey), [entries, mKey]);
  const monthlyAch = MONTHLY_TARGET > 0 ? (monthlyActual / MONTHLY_TARGET) * 100 : 0;

  const shiftTotals = useMemo(
    () =>
      ALL_SHIFTS.map((s) => ({
        shift: s,
        actual: sumLoads(entries.filter((e) => e.entry_date === bDate && e.shift === s)),
      })),
    [entries, bDate],
  );

  const lastHour = useMemo(() => lastCompletedHour(entries, now), [entries, now]);
  const lastDay = useMemo(() => lastDayTotal(entries, now), [entries, now]);
  const prevM = previousMonthKey(now);
  const lastMonth = useMemo(() => totalForMonth(entries, prevM), [entries, prevM]);
  const highest = useMemo(() => highestOfMonth(entries, mKey), [entries, mKey]);
  const celebrate = useMemo(() => celebratedDays(entries, mKey), [entries, mKey]);

  return (
    <div className="min-h-screen w-full text-white overflow-hidden flex flex-col" style={{ background: "#000" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-10 pt-8 pb-6 border-b border-[oklch(0.78_0.14_82/25%)]">
        <div className="flex items-center gap-6">
          <div className="h-24 w-24 rounded-2xl overflow-hidden bg-white p-2">
            <img src={logoAsset.url} alt="Phorotech" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="font-[family-name:var(--font-display)] title-text text-5xl font-bold tracking-wide leading-tight">
              PHOROTECH SURFIN INDIA PVT LTD
            </h1>
            <p className="mt-1 text-2xl text-[color:var(--cyan)] tracking-[0.3em] uppercase font-medium">
              Plant II · ED Plant · Irungattukottai
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="font-[family-name:var(--font-mono)] gold-text text-5xl font-bold">
            {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
          </div>
          <div className="mt-1 text-xl text-white/80 font-medium">
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 grid grid-cols-12 gap-6 px-10 py-6">
        {/* Monthly Production - big hero left */}
        <div className="col-span-5 glass-gold rounded-3xl p-8 gold-glow flex flex-col justify-center">
          <div className="text-lg uppercase tracking-[0.4em] text-[color:var(--cyan)] font-semibold">Monthly Production</div>
          <div className="text-2xl text-white/70 mt-1">{monthName(now)}</div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <div className="text-lg uppercase text-white/60 tracking-widest">Actual</div>
              <div className="font-[family-name:var(--font-mono)] gold-text text-8xl font-bold leading-none">
                {monthlyActual.toLocaleString("en-IN")}
              </div>
            </div>
            <div>
              <div className="text-lg uppercase text-white/60 tracking-widest">Target</div>
              <div className="font-[family-name:var(--font-mono)] text-white text-8xl font-bold leading-none">
                {MONTHLY_TARGET.toLocaleString("en-IN")}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="text-lg uppercase text-white/60 tracking-widest">Achievement</div>
            <div className="mt-1 flex items-baseline gap-4">
              <span
                className="font-[family-name:var(--font-mono)] text-7xl font-bold"
                style={{ color: monthlyAch >= 90 ? "var(--success)" : monthlyAch >= 60 ? "var(--warning)" : "var(--danger)" }}
              >
                {monthlyAch.toFixed(2)}%
              </span>
            </div>
            <div className="mt-3 h-4 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, monthlyAch)}%`,
                  background: "linear-gradient(90deg,#FFD700,#D4AF37)",
                }}
              />
            </div>
          </div>
        </div>

        {/* Middle column: Current Shift + Shift Details */}
        <div className="col-span-4 flex flex-col gap-6">
          <div className="glass-gold rounded-3xl p-6 relative">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-4 w-4 rounded-full bg-[color:var(--success)] pulse-green" />
              <span className="text-lg font-bold tracking-widest text-[color:var(--success)]">● LIVE</span>
            </div>
            <div className="text-lg uppercase tracking-[0.3em] text-[color:var(--cyan)]">Current Shift</div>
            <div className="font-[family-name:var(--font-display)] title-text text-6xl font-bold mt-2">{SHIFTS[shift].label}</div>
            <div className="font-[family-name:var(--font-mono)] text-2xl text-white/80 mt-1">{SHIFTS[shift].range}</div>
          </div>

          <div className="glass-gold rounded-3xl p-6 flex-1">
            <div className="text-lg uppercase tracking-[0.3em] text-[color:var(--cyan)] mb-4">Shift Details · Today</div>
            <div className="space-y-3">
              {shiftTotals.map(({ shift: s, actual }) => {
                const active = s === shift;
                const pct = SHIFT_TARGET > 0 ? (actual / SHIFT_TARGET) * 100 : 0;
                const color = pct >= 100 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--danger)";
                return (
                  <div
                    key={s}
                    className={`rounded-2xl p-4 border ${active ? "border-[color:var(--success)]/60 bg-[oklch(0.72_0.19_145/8%)]" : "border-white/10 bg-white/[0.02]"}`}
                  >
                    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        {active && <span className="h-3 w-3 rounded-full bg-[color:var(--success)] pulse-green" />}
                        <div className="font-[family-name:var(--font-display)] text-3xl font-bold text-white truncate">
                          {SHIFTS[s].label}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase text-white/50">Actual</div>
                        <div className="font-[family-name:var(--font-mono)] text-3xl font-bold" style={{ color }}>{actual}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase text-white/50">Target</div>
                        <div className="font-[family-name:var(--font-mono)] text-3xl font-bold text-white/80">{SHIFT_TARGET}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Last Hour, Last Day, Last Month, Highest */}
        <div className="col-span-3 flex flex-col gap-4">
          <MiniCard title="Last Hour" accent>
            <div className="font-[family-name:var(--font-mono)] text-2xl text-white/80">{lastHour?.slot ?? "—"}</div>
            <div className="font-[family-name:var(--font-mono)] gold-text text-6xl font-bold mt-1">
              {lastHour ? `${lastHour.loads}` : "—"}
            </div>
            <div className="text-sm text-white/60 uppercase tracking-widest">Loads</div>
          </MiniCard>

          <MiniCard title="Last Day">
            <div className="font-[family-name:var(--font-mono)] text-2xl text-white/80">{lastDay ? formatDMY(lastDay.date) : "—"}</div>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs uppercase text-white/50">Actual</div>
                <div className="font-[family-name:var(--font-mono)] gold-text text-4xl font-bold">{lastDay?.loads ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-white/50">Target</div>
                <div className="font-[family-name:var(--font-mono)] text-4xl font-bold text-white/80">{DAILY_TARGET}</div>
              </div>
            </div>
          </MiniCard>

          <MiniCard title="Last Month">
            <div className="font-[family-name:var(--font-mono)] text-2xl text-white/80">{monthNameFromKey(prevM)}</div>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <div>
                <div className="text-xs uppercase text-white/50">Actual</div>
                <div className="font-[family-name:var(--font-mono)] gold-text text-4xl font-bold">{lastMonth.toLocaleString("en-IN")}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-white/50">Target</div>
                <div className="font-[family-name:var(--font-mono)] text-4xl font-bold text-white/80">{MONTHLY_TARGET.toLocaleString("en-IN")}</div>
              </div>
            </div>
          </MiniCard>

          <MiniCard title="Highest Production" highlight>
            <div className="font-[family-name:var(--font-mono)] text-2xl text-white/80">{highest.date ? formatDMY(highest.date) : "—"}</div>
            <div className="font-[family-name:var(--font-mono)] gold-text text-5xl font-bold mt-1">
              {highest.dailyTotal}
            </div>
            <div className="text-sm text-white/60 uppercase tracking-widest">Loads</div>
          </MiniCard>
        </div>
      </main>

      {/* Marquee footer */}
      {celebrate.length > 0 && (
        <footer className="border-t border-[oklch(0.78_0.14_82/40%)] bg-gradient-to-r from-[#0A0A0A] via-[#1a1300] to-[#0A0A0A] py-5 overflow-hidden">
          <div className="marquee-track whitespace-nowrap flex gap-16 font-[family-name:var(--font-display)] text-3xl font-bold">
            {[...celebrate, ...celebrate].map((d, i) => (
              <span key={i} className="inline-flex items-center gap-4">
                <span>🎉</span>
                <span className="gold-text">Congratulations!</span>
                <span className="text-white">{formatDMY(d.date)} achieved {d.loads} Loads.</span>
                <span className="text-[color:var(--cyan)]">Excellent Production Performance.</span>
                <span className="text-[color:var(--gold-light)]">✦</span>
              </span>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
}

function MiniCard({
  title, children, accent, highlight,
}: { title: string; children: React.ReactNode; accent?: boolean; highlight?: boolean }) {
  return (
    <div className={`glass-gold rounded-2xl p-5 flex-1 ${highlight ? "gold-glow" : ""} ${accent ? "cyan-glow" : ""}`}>
      <div className="text-sm uppercase tracking-[0.3em] text-[color:var(--cyan)] font-semibold">{title}</div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

// Suppress unused import warning in strict mode
void CELEBRATE_THRESHOLD;
