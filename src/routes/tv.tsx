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

  // Fluid sizes — always fit any TV/desktop/laptop/tablet without scrolling.
  const F = {
    title: "text-[clamp(14px,1.6vw,28px)]",
    ppms: "text-[clamp(26px,3.4vw,64px)]",
    subtitle: "text-[clamp(10px,1vw,18px)]",
    clock: "text-[clamp(18px,2.2vw,44px)]",
    date: "text-[clamp(10px,1vw,18px)]",
    cardLabel: "text-[clamp(9px,0.85vw,14px)]",
    cardHead: "text-[clamp(11px,1.05vw,18px)]",
    monthHead: "text-[clamp(16px,1.8vw,32px)]",
    monthHero: "text-[clamp(32px,7vw,132px)]",
    achLabel: "text-[clamp(10px,1.05vw,16px)]",
    hero: "text-[clamp(28px,5.2vw,96px)]",
    big: "text-[clamp(22px,3.6vw,64px)]",
    mid: "text-[clamp(18px,2.6vw,44px)]",
    small: "text-[clamp(14px,1.6vw,26px)]",
  };

  const MetricCard = ({
    title,
    subtitle,
    actual,
    target,
    glow = "",
    live = false,
  }: {
    title: string;
    subtitle?: string;
    actual: string | number;
    target: string | number;
    glow?: string;
    live?: boolean;
  }) => (
    <div className={`glass-gold rounded-2xl p-[0.9vw] min-w-0 overflow-hidden flex flex-col ${glow}`}>
      <div className="flex items-center gap-2 min-w-0">
        {live && <span className="h-[1vh] w-[1vh] rounded-full bg-[color:var(--success)] pulse-green shrink-0" />}
        <div className={`uppercase tracking-[0.25em] text-[color:var(--cyan)] font-extrabold truncate ${F.cardHead}`}>
          {title}
        </div>
      </div>
      {subtitle && (
        <div className={`font-[family-name:var(--font-mono)] text-white font-bold truncate ${F.small}`}>
          {subtitle}
        </div>
      )}
      <div className="mt-[0.3vh] grid grid-cols-2 gap-[0.6vw] flex-1 min-h-0">
        <div className="rounded-lg bg-black/30 border border-white/5 flex flex-col items-center justify-center min-w-0 px-1">
          <div className={`font-[family-name:var(--font-mono)] gold-text font-black leading-none text-center ${F.big}`}>
            {actual}
          </div>
          <div className={`uppercase text-white/60 tracking-widest font-bold text-center mt-[0.2vh] ${F.cardLabel}`}>
            Actual Loads
          </div>
        </div>
        <div className="rounded-lg bg-black/30 border border-white/5 flex flex-col items-center justify-center min-w-0 px-1">
          <div className={`font-[family-name:var(--font-mono)] text-white font-black leading-none text-center ${F.big}`}>
            {target}
          </div>
          <div className={`uppercase text-white/60 tracking-widest font-bold text-center mt-[0.2vh] ${F.cardLabel}`}>
            Target Loads
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="w-screen h-screen overflow-hidden text-white flex flex-col"
      style={{ background: "#000" }}
    >
      {/* Header */}
      <header className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-[2vw] py-[1vh] border-b border-[oklch(0.78_0.14_82/25%)] shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-[6vh] w-[6vh] shrink-0 rounded-xl overflow-hidden bg-white p-1">
            <img src={logoAsset.url} alt="Phorotech" className="h-full w-full object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className={`font-[family-name:var(--font-display)] title-text font-extrabold tracking-wide leading-tight truncate ${F.title}`}>
              PHOROTECH SURFIN INDIA PVT LTD
            </h1>
            <p className={`text-[color:var(--cyan)] tracking-[0.2em] uppercase font-bold truncate ${F.subtitle}`}>
              Plant II · ED Plant · Irungattukottai
            </p>
          </div>
        </div>
        <div className="text-center min-w-0 px-2">
          <div className={`font-[family-name:var(--font-display)] gold-text font-black leading-none tracking-[0.15em] ${F.ppms}`}>
            PPMS
          </div>
          <div className={`mt-[0.4vh] uppercase text-white/85 font-bold tracking-[0.18em] truncate ${F.subtitle}`}>
            Production Performance Monitoring System
          </div>
        </div>
        <div className="text-right shrink-0 justify-self-end">
          <div className={`font-[family-name:var(--font-mono)] gold-text font-extrabold leading-none ${F.clock}`}>
            {now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
          </div>
          <div className={`mt-1 text-white/85 font-semibold ${F.date}`}>
            {now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </div>
        </div>
      </header>


      {/* Main */}
      <main className="flex-1 min-h-0 grid grid-cols-12 gap-[1.2vw] p-[1.2vw]">
        {/* Monthly Production - hero */}
        <section className="col-span-12 lg:col-span-5 glass-gold rounded-2xl p-[1.2vw] gold-glow flex flex-col min-w-0 min-h-0 overflow-hidden">
          <div className="text-center shrink-0">
            <div className={`uppercase tracking-[0.3em] text-[color:var(--cyan)] font-black ${F.monthHead}`}>
              Monthly Production
            </div>
            <div className={`font-black text-white font-[family-name:var(--font-display)] uppercase tracking-wider mt-[0.6vh] ${F.mid}`}>
              {monthName(now)}
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col gap-[1vh] mt-[1.2vh]">
            <div className="flex-1 rounded-2xl border border-[oklch(0.78_0.14_82/30%)] bg-black/50 flex flex-col items-center justify-center min-w-0 min-h-0 p-[1vw]">
              <div className={`uppercase text-white/70 tracking-[0.2em] font-bold text-center ${F.cardLabel}`}>Actual Loads</div>
              <div className={`font-[family-name:var(--font-mono)] gold-text font-black leading-none text-center mt-[0.6vh] ${F.monthHero}`}>
                {monthlyActual.toLocaleString("en-IN")}
              </div>
            </div>
            <div className="flex-1 rounded-2xl border border-[oklch(0.78_0.14_82/30%)] bg-black/50 flex flex-col items-center justify-center min-w-0 min-h-0 p-[1vw]">
              <div className={`uppercase text-white/70 tracking-[0.2em] font-bold text-center ${F.cardLabel}`}>Target Loads</div>
              <div className={`font-[family-name:var(--font-mono)] text-white font-black leading-none text-center mt-[0.6vh] ${F.monthHero}`}>
                {MONTHLY_TARGET.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          <div className="mt-[1.2vh] shrink-0">
            <div className="flex items-baseline justify-between gap-2">
              <div className={`uppercase text-white/70 tracking-widest font-bold ${F.achLabel}`}>Achievement</div>
              <span
                className={`font-[family-name:var(--font-mono)] font-extrabold ${F.mid}`}
                style={{ color: achColor(monthlyAch) }}
              >
                {monthlyAch.toFixed(2)}%
              </span>
            </div>
            <div className="mt-[0.4vh] h-[1.2vh] rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, monthlyAch)}%`,
                  background: "linear-gradient(90deg,#FFD700,#D4AF37)",
                }}
              />
            </div>
          </div>
        </section>

        {/* Middle column: Total Loads Today + Shift Details */}
        <section className="col-span-12 lg:col-span-4 flex flex-col gap-[1.2vw] min-w-0 min-h-0">
          <MetricCard
            title="Total Loads Today"
            actual={todayActual}
            target={DAILY_TARGET}
            live
          />

          <div className="glass-gold rounded-2xl p-[1.1vw] flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">
            <div className={`uppercase tracking-[0.25em] text-[color:var(--cyan)] font-extrabold mb-[0.6vh] ${F.cardHead}`}>
              Shift Details · Today
            </div>
            <div className="flex-1 grid grid-rows-3 gap-[0.6vh] min-h-0">
              {shiftTotals.map(({ shift: s, actual }) => {
                const active = s === shift;
                const pct = SHIFT_TARGET > 0 ? (actual / SHIFT_TARGET) * 100 : 0;
                const color = achColor(pct);
                return (
                  <div
                    key={s}
                    className={`rounded-xl px-[0.8vw] py-[0.5vh] border min-h-0 flex flex-col ${active ? "border-[color:var(--success)]/60 bg-[oklch(0.72_0.19_145/8%)]" : "border-white/10 bg-white/[0.02]"}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {active && <span className="h-[0.9vh] w-[0.9vh] rounded-full bg-[color:var(--success)] pulse-green shrink-0" />}
                      <div className={`font-[family-name:var(--font-display)] font-extrabold text-white truncate ${F.small}`}>
                        {SHIFTS[s].label}
                      </div>
                      <div className={`font-[family-name:var(--font-mono)] text-white/70 truncate ml-auto ${F.cardLabel}`}>
                        {SHIFTS[s].range}
                      </div>
                    </div>
                    <div className="mt-[0.3vh] grid grid-cols-2 gap-[0.6vw] flex-1 min-h-0">
                      <div className="rounded-lg bg-black/30 border border-white/5 flex flex-col items-center justify-center min-w-0 px-2">
                        <div className={`font-[family-name:var(--font-mono)] font-black leading-none text-center ${F.big}`} style={{ color }}>
                          {actual}
                        </div>
                        <div className={`uppercase text-white/60 tracking-widest font-bold text-center mt-[0.2vh] ${F.cardLabel}`}>Actual</div>
                      </div>
                      <div className="rounded-lg bg-black/30 border border-white/5 flex flex-col items-center justify-center min-w-0 px-2">
                        <div className={`font-[family-name:var(--font-mono)] font-black text-white leading-none text-center ${F.big}`}>
                          {SHIFT_TARGET}
                        </div>
                        <div className={`uppercase text-white/60 tracking-widest font-bold text-center mt-[0.2vh] ${F.cardLabel}`}>Target</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right column: 4 stacked cards */}
        <section className="col-span-12 lg:col-span-3 grid grid-rows-4 gap-[1vw] min-w-0 min-h-0">
          {[
            {
              title: "Last Hour Production",
              subtitle: lastHour?.slot ?? "—",
              actual: lastHour ? String(lastHour.loads) : "—",
              target: "10",
              glow: "cyan-glow",
            },
            {
              title: "Last Day Production",
              subtitle: lastDay ? formatDMY(lastDay.date) : "—",
              actual: lastDay ? String(lastDay.loads) : "—",
              target: String(DAILY_TARGET),
              glow: "",
            },
            {
              title: "Last Month Production",
              subtitle: monthNameFromKey(prevMKey),
              actual: lastMonthActual.toLocaleString("en-IN"),
              target: MONTHLY_TARGET.toLocaleString("en-IN"),
              glow: "",
            },
            {
              title: "Highest Production",
              subtitle: highest.date ? formatDMY(highest.date) : "—",
              actual: String(highest.dailyTotal),
              target: String(DAILY_TARGET),
              glow: "gold-glow",
            },
          ].map((c, i) => (
            <MetricCard key={i} {...c} />
          ))}
        </section>
      </main>

      {/* Marquee footer */}
      {celebrate.length > 0 && (
        <footer className="border-t border-[oklch(0.78_0.14_82/40%)] bg-gradient-to-r from-[#0A0A0A] via-[#1a1300] to-[#0A0A0A] py-[0.6vh] overflow-hidden shrink-0">
          <div className={`marquee-track whitespace-nowrap flex gap-16 font-[family-name:var(--font-display)] font-extrabold ${F.small}`}>
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
