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

  const todayActual = useMemo(
    () => sumLoads(entries.filter((e) => e.entry_date === bDate)),
    [entries, bDate],
  );

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
  const prevMKey = useMemo(() => previousMonthKey(now), [now]);
  const lastMonthActual = useMemo(() => totalForMonth(entries, prevMKey), [entries, prevMKey]);
  const highest = useMemo(() => highestOfMonth(entries, mKey), [entries, mKey]);
  const celebrate = useMemo(() => celebratedDays(entries, mKey), [entries, mKey]);

  const achColor = (pct: number) =>
    pct >= 90 ? "var(--success)" : pct >= 60 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="min-h-screen w-full text-white overflow-x-hidden flex flex-col" style={{ background: "#000" }}>
      {/* Header */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-6 px-6 sm:px-10 pt-6 sm:pt-10 pb-6 sm:pb-8 border-b border-[oklch(0.78_0.14_82/25%)]">
        <div className="flex items-center gap-4 sm:gap-8 min-w-0">
          <div className="h-16 w-16 sm:h-24 sm:w-24 shrink-0 rounded-2xl overflow-hidden bg-white p-2">
            <img src={logoAsset.url} alt="Phorotech" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="font-[family-name:var(--font-display)] title-text text-2xl sm:text-4xl lg:text-6xl font-extrabold tracking-wide leading-tight break-words">
              PHOROTECH SURFIN INDIA PVT LTD
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-xl lg:text-3xl text-[color:var(--cyan)] tracking-[0.2em] uppercase font-bold break-words">
              Plant II · ED Plant · Irungattukottai
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-[family-name:var(--font-mono)] gold-text text-2xl sm:text-4xl lg:text-6xl font-extrabold">
            {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
          </div>
          <div className="mt-1 sm:mt-2 text-xs sm:text-lg lg:text-2xl text-white/85 font-semibold">
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 px-6 sm:px-10 py-6 sm:py-8">
        {/* Monthly Production - hero */}
        <div className="lg:col-span-5 glass-gold rounded-3xl p-6 sm:p-10 gold-glow flex flex-col min-w-0">
          <div className="text-lg sm:text-2xl uppercase tracking-[0.3em] text-[color:var(--cyan)] font-extrabold break-words">
            Monthly Production
          </div>
          <div className="text-2xl sm:text-4xl font-extrabold text-white mt-2 sm:mt-3 font-[family-name:var(--font-display)] uppercase tracking-wider break-words">
            {monthName(now)}
          </div>
          <div className="text-sm sm:text-xl uppercase tracking-[0.3em] text-white/70 font-bold mt-2 break-words">
            Total No. of Loads
          </div>

          <div className="mt-6 sm:mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 min-w-0">
            <div className="min-w-0">
              <div className="text-base sm:text-xl uppercase text-white/70 tracking-widest font-bold">Actual Loads</div>
              <div className="font-[family-name:var(--font-mono)] gold-text font-extrabold leading-none mt-1 break-words text-[clamp(3.5rem,10vw,9rem)]">
                {monthlyActual.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-base sm:text-xl uppercase text-white/70 tracking-widest font-bold">Target Loads</div>
              <div className="font-[family-name:var(--font-mono)] text-white font-extrabold leading-none mt-1 break-words text-[clamp(3.5rem,10vw,9rem)]">
                {MONTHLY_TARGET.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-6 sm:pt-8">
            <div className="text-base sm:text-xl uppercase text-white/70 tracking-widest font-bold">Achievement</div>
            <div className="mt-2 flex items-baseline gap-4 flex-wrap">
              <span
                className="font-[family-name:var(--font-mono)] text-5xl sm:text-8xl font-extrabold break-words"
                style={{ color: achColor(monthlyAch) }}
              >
                {monthlyAch.toFixed(2)}%
              </span>
            </div>
            <div className="mt-4 h-4 sm:h-5 rounded-full bg-white/10 overflow-hidden">
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

        {/* Middle column: Total Loads Today + Shift Details */}
        <div className="lg:col-span-4 flex flex-col gap-6 sm:gap-8 min-w-0">
          {/* Total Loads Today (Actual / Target only) */}
          <div className="glass-gold rounded-3xl p-6 sm:p-8 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="h-3 w-3 sm:h-4 sm:w-4 rounded-full bg-[color:var(--success)] pulse-green" />
              <span className="text-base sm:text-lg font-extrabold tracking-widest text-[color:var(--success)]">● LIVE</span>
            </div>
            <div className="text-lg sm:text-2xl uppercase tracking-[0.3em] text-[color:var(--cyan)] font-extrabold break-words">
              Total Loads Today
            </div>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-0">
              <div className="min-w-0">
                <div className="text-sm sm:text-base uppercase text-white/70 tracking-widest font-bold">Actual</div>
                <div className="font-[family-name:var(--font-mono)] gold-text font-extrabold leading-none mt-1 break-words text-[clamp(3rem,8vw,6rem)]">
                  {todayActual}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-sm sm:text-base uppercase text-white/70 tracking-widest font-bold">Target</div>
                <div className="font-[family-name:var(--font-mono)] text-white font-extrabold leading-none mt-1 break-words text-[clamp(3rem,8vw,6rem)]">
                  {DAILY_TARGET}
                </div>
              </div>
            </div>
          </div>

          {/* Shift Details */}
          <div className="glass-gold rounded-3xl p-6 sm:p-8 flex-1 min-w-0">
            <div className="text-lg sm:text-2xl uppercase tracking-[0.3em] text-[color:var(--cyan)] font-extrabold mb-5 break-words">
              Shift Details · Today
            </div>
            <div className="space-y-4">
              {shiftTotals.map(({ shift: s, actual }) => {
                const active = s === shift;
                const pct = SHIFT_TARGET > 0 ? (actual / SHIFT_TARGET) * 100 : 0;
                const color = achColor(pct);
                return (
                  <div
                    key={s}
                    className={`rounded-2xl p-4 sm:p-5 border ${active ? "border-[color:var(--success)]/60 bg-[oklch(0.72_0.19_145/8%)]" : "border-white/10 bg-white/[0.02]"}`}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4 sm:gap-6 min-w-0">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          {active && <span className="h-3 w-3 rounded-full bg-[color:var(--success)] pulse-green shrink-0" />}
                          <div className="font-[family-name:var(--font-display)] text-2xl sm:text-4xl font-extrabold text-white break-words">
                            {SHIFTS[s].label}
                          </div>
                          {active && (
                            <span className="text-xs font-extrabold tracking-widest text-[color:var(--success)]">LIVE</span>
                          )}
                        </div>
                        <div className="font-[family-name:var(--font-mono)] text-base sm:text-xl text-white/80 mt-1 break-words">
                          {SHIFTS[s].range}
                        </div>
                      </div>
                      <div className="text-right min-w-0">
                        <div className="text-xs sm:text-sm uppercase text-white/60 font-bold">Actual</div>
                        <div className="font-[family-name:var(--font-mono)] text-3xl sm:text-4xl font-extrabold break-words" style={{ color }}>
                          {actual}
                        </div>
                      </div>
                      <div className="text-right min-w-0">
                        <div className="text-xs sm:text-sm uppercase text-white/60 font-bold">Target</div>
                        <div className="font-[family-name:var(--font-mono)] text-3xl sm:text-4xl font-extrabold text-white/85 break-words">
                          {SHIFT_TARGET}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Last Hour + Last Day + Last Month + Highest */}
        <div className="lg:col-span-3 flex flex-col gap-6 sm:gap-8 min-w-0">
          <div className="glass-gold rounded-3xl p-6 sm:p-8 cyan-glow min-w-0">
            <div className="text-base sm:text-xl uppercase tracking-[0.25em] text-[color:var(--cyan)] font-extrabold break-words">
              Last Hour Production
            </div>
            <div className="font-[family-name:var(--font-mono)] text-xl sm:text-2xl text-white font-bold mt-3 break-words">
              {lastHour?.slot ?? "—"}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <div className="text-xs sm:text-sm uppercase text-white/70 tracking-widest font-bold">Actual</div>
                <div className="font-[family-name:var(--font-mono)] gold-text font-extrabold leading-none mt-1 break-words text-[clamp(2.5rem,6vw,5rem)]">
                  {lastHour ? lastHour.loads : "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm uppercase text-white/70 tracking-widest font-bold">Target</div>
                <div className="font-[family-name:var(--font-mono)] text-white font-extrabold leading-none mt-1 break-words text-[clamp(2.5rem,6vw,5rem)]">
                  10
                </div>
              </div>
            </div>
          </div>

          <div className="glass-gold rounded-3xl p-6 sm:p-8 min-w-0">
            <div className="text-base sm:text-xl uppercase tracking-[0.25em] text-[color:var(--cyan)] font-extrabold break-words">
              Last Day Production
            </div>
            <div className="font-[family-name:var(--font-mono)] text-xl sm:text-2xl text-white font-bold mt-3 break-words">
              {lastDay ? formatDMY(lastDay.date) : "—"}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <div className="text-xs sm:text-sm uppercase text-white/70 tracking-widest font-bold">Actual</div>
                <div className="font-[family-name:var(--font-mono)] gold-text font-extrabold leading-none mt-1 break-words text-[clamp(2.5rem,6vw,5rem)]">
                  {lastDay ? lastDay.loads : "—"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm uppercase text-white/70 tracking-widest font-bold">Target</div>
                <div className="font-[family-name:var(--font-mono)] text-white font-extrabold leading-none mt-1 break-words text-[clamp(2.5rem,6vw,5rem)]">
                  {DAILY_TARGET}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-gold rounded-3xl p-6 sm:p-8 min-w-0">
            <div className="text-base sm:text-xl uppercase tracking-[0.25em] text-[color:var(--cyan)] font-extrabold break-words">
              Last Month Production
            </div>
            <div className="font-[family-name:var(--font-mono)] text-xl sm:text-2xl text-white font-bold mt-3 break-words">
              {monthNameFromKey(prevMKey)}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 min-w-0">
              <div className="min-w-0">
                <div className="text-xs sm:text-sm uppercase text-white/70 tracking-widest font-bold">Actual</div>
                <div className="font-[family-name:var(--font-mono)] gold-text font-extrabold leading-none mt-1 break-words text-[clamp(2.25rem,5.5vw,4.5rem)]">
                  {lastMonthActual.toLocaleString("en-IN")}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm uppercase text-white/70 tracking-widest font-bold">Target</div>
                <div className="font-[family-name:var(--font-mono)] text-white font-extrabold leading-none mt-1 break-words text-[clamp(2.25rem,5.5vw,4.5rem)]">
                  {MONTHLY_TARGET.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-gold rounded-3xl p-6 sm:p-8 gold-glow min-w-0">
            <div className="text-base sm:text-xl uppercase tracking-[0.25em] text-[color:var(--cyan)] font-extrabold break-words">
              Highest Production
            </div>
            <div className="font-[family-name:var(--font-mono)] text-xl sm:text-2xl text-white font-bold mt-3 break-words">
              {highest.date ? formatDMY(highest.date) : "—"}
            </div>
            <div className="mt-6">
              <div className="text-xs sm:text-sm uppercase text-white/70 tracking-widest font-bold">Loads</div>
              <div className="font-[family-name:var(--font-mono)] gold-text font-extrabold leading-none mt-1 break-words text-[clamp(2.75rem,6.5vw,5.5rem)]">
                {highest.dailyTotal}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Marquee footer */}
      {celebrate.length > 0 && (
        <footer className="border-t border-[oklch(0.78_0.14_82/40%)] bg-gradient-to-r from-[#0A0A0A] via-[#1a1300] to-[#0A0A0A] py-4 sm:py-6 overflow-hidden">
          <div className="marquee-track whitespace-nowrap flex gap-16 font-[family-name:var(--font-display)] text-2xl sm:text-4xl font-extrabold">
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
