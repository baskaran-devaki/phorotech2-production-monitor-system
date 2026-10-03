import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp, CalendarDays, Lightbulb, Target, TrendingUp } from "lucide-react";
import { monthKey, monthNameFromKey, type ProductionEntry } from "@/lib/production";
import { buildReport, monthOptions, monthRange } from "@/lib/report";

function fmtDate(d: string) {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

const SHIFT_META = [
  { key: 1 as const, label: "First Shift", color: "var(--neon-blue)" },
  { key: 2 as const, label: "Second Shift", color: "var(--neon-orange)" },
  { key: 3 as const, label: "Third Shift", color: "var(--neon-green)" },
];

export function MobileAnalytics({ entries, businessDate }: { entries: ProductionEntry[]; businessDate: string }) {
  const currentKey = monthKey(businessDate);
  const [selected, setSelected] = useState(currentKey);
  const options = useMemo(() => {
    const [y, m] = currentKey.split("-").map(Number);
    return monthOptions(24, new Date(y, m - 1, 1));
  }, [currentKey]);

  const report = useMemo(() => {
    const r = monthRange(selected);
    return buildReport(entries, r.from, r.to, monthNameFromKey(selected));
  }, [entries, selected]);

  const working = report.days.filter((d) => d.isWorkingDay);
  const maxLoads = working.length ? Math.max(...working.map((d) => d.total)) : 0;
  const minLoads = working.length ? Math.min(...working.map((d) => d.total)) : 0;
  const best = working.filter((d) => d.total === maxLoads);
  const lowest = working.filter((d) => d.total === minLoads);
  const pct = (d: { total: number; target: number }) => (d.target ? `${((d.total / d.target) * 100).toFixed(0)}%` : "—");
  const chart = report.days.map((d) => ({ day: d.date.slice(8), loads: d.total }));
  const ach = report.achievement;
  const achColor = ach >= 90 ? "var(--neon-green)" : ach >= 60 ? "var(--neon-orange)" : "var(--neon-red)";

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="min-w-0">
          <p className="mobile-eyebrow">Analytics</p>
          <h1 className="mt-1 font-sans text-xl font-black leading-tight">Production Summary</h1>
        </div>
        <label className="neon-select">
          <CalendarDays className="size-4 shrink-0 text-mobile-accent" />
          <select value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Select month">
            {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </label>
      </div>

      <div className="neon-card">
        <p className="text-sm font-extrabold text-foreground">Total Monthly Loads <span className="text-xs font-semibold text-muted-foreground">({report.periodLabel})</span></p>
        <p className="neon-text mt-3 text-5xl font-black tabular-nums">{report.totalActual.toLocaleString("en-IN")}</p>
        <p className="text-xs text-muted-foreground">Loads</p>

        <div className="my-4 h-px bg-border" />
        <p className="text-sm font-bold text-foreground">Shift-wise Total</p>
        <div className="mt-2 space-y-2.5">
          {SHIFT_META.map((s) => {
            const v = report.shiftTotals[s.key];
            const share = report.totalActual ? (v / report.totalActual) * 100 : 0;
            return (
              <div key={s.key} className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3">
                <span className="size-3 rounded-full" style={{ background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                <span className="truncate text-sm text-muted-foreground">Total {s.label} Loads</span>
                <strong className="tabular-nums text-foreground">{v.toLocaleString("en-IN")}</strong>
                <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">{share.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>

        <div className="my-4 h-px bg-border" />
        <div className="grid grid-cols-2 divide-x divide-border">
          <div className="pr-3">
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><Target className="size-3.5" />Total Target</p>
            <p className="mt-1 text-2xl font-black tabular-nums text-foreground">{report.totalTarget.toLocaleString("en-IN")}</p>
          </div>
          <div className="pl-3">
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><TrendingUp className="size-3.5" />Achievement</p>
            <p className="mt-1 text-2xl font-black tabular-nums" style={{ color: achColor, textShadow: `0 0 12px ${achColor}` }}>{ach.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="neon-card p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Total Working Days</p>
          <p className="neon-text mt-1 text-2xl font-black tabular-nums">{report.totalWorkingDays}</p>
        </div>
        <div className="neon-card p-3">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Sunday Working Days</p>
          <p className="neon-text mt-1 text-2xl font-black tabular-nums">{report.sundayWorkingDays}</p>
        </div>
      </div>

      <div className="neon-card">
        <p className="flex items-center gap-2 text-base font-extrabold text-foreground"><Lightbulb className="size-5 text-mobile-accent" style={{ filter: "drop-shadow(0 0 6px var(--neon-blue))" }} />Quick Insights</p>
        <div className="mt-3 space-y-2">
          <Insight tone="var(--neon-green)" icon={<ArrowUp className="size-5" />} title="Best Performing Day" days={best} pct={pct} />
          <Insight tone="var(--neon-red)" icon={<ArrowDown className="size-5" />} title="Lowest Performing Day" days={lowest} pct={pct} />
        </div>
      </div>

      <div className="neon-card">
        <p className="text-sm font-extrabold text-foreground">Daily Production Trend</p>
        <p className="text-xs text-muted-foreground">Day vs Production Loads</p>
        <div className="mt-3 h-56">
          {chart.length === 0 ? (
            <p className="grid h-full place-items-center text-sm text-muted-foreground">No production data for this month</p>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chart} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="neonArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--neon-blue)" stopOpacity={0.55} />
                    <stop offset="100%" stopColor="var(--neon-blue)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--mobile-surface)", border: "1px solid var(--neon-blue)", borderRadius: 10, color: "var(--foreground)", fontSize: 12 }}
                  labelFormatter={(l) => `Day ${l}`}
                  formatter={(v) => [v, "Loads"]}
                />
                <Area type="monotone" dataKey="loads" stroke="var(--neon-blue)" strokeWidth={2.5} fill="url(#neonArea)" style={{ filter: "drop-shadow(0 0 6px var(--neon-blue))" }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}

function Insight({ tone, icon, title, days, pct }: { tone: string; icon: React.ReactNode; title: string; days: Array<{ date: string; total: number; target: number }>; pct: (d: { total: number; target: number }) => string }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-lg border p-3" style={{ borderColor: `color-mix(in oklab, ${tone} 45%, transparent)`, background: `color-mix(in oklab, ${tone} 10%, transparent)` }}>
      <span className="grid size-10 place-items-center rounded-full" style={{ background: `color-mix(in oklab, ${tone} 22%, transparent)`, color: tone, boxShadow: `0 0 12px color-mix(in oklab, ${tone} 50%, transparent)` }}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-bold" style={{ color: tone }}>{title}</p>
        {days.length === 0 ? (
          <p className="font-extrabold text-foreground">—</p>
        ) : (
          days.map((d) => (
            <div key={d.date} className="mt-1">
              <p className="font-extrabold text-foreground">{fmtDate(d.date)}</p>
              <p className="text-xs text-muted-foreground">Total Loads: {d.total} ({pct(d)})</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
