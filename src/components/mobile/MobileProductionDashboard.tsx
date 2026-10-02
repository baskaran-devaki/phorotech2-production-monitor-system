import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  BarChart3,
  Check,
  Clipboard,
  FileText,
  Gauge,
  LogIn,
  MonitorUp,
  Settings,
  Share2,
  Shield,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import logoAsset from "@/assets/phorotech-logo.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { useProductionMode } from "@/hooks/useProductionMode";
import {
  ALL_SHIFTS,
  DAILY_TARGET,
  SHIFTS,
  SHIFT_TARGET,
  currentShift,
  monthKey,
  monthNameFromKey,
  sumLoads,
  type ProductionEntry,
} from "@/lib/production";
import { buildReport, monthRange } from "@/lib/report";

type MobileView = "dashboard" | "reports" | "analytics" | "settings";

interface MobileProductionDashboardProps {
  entries: ProductionEntry[];
  businessDate: string;
  online: boolean;
  isSignedIn: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  onOpenReport: () => void;
}

const NAV_ITEMS: Array<{ key: MobileView; label: string; icon: typeof Gauge }> = [
  { key: "dashboard", label: "Dashboard", icon: Gauge },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "settings", label: "Settings", icon: Settings },
];

export function MobileProductionDashboard({
  entries,
  businessDate,
  online,
  isSignedIn,
  isAdmin,
  isSuperAdmin,
  onOpenReport,
}: MobileProductionDashboardProps) {
  const [view, setView] = useState<MobileView>("dashboard");
  const [tvUrl, setTvUrl] = useState("/tv");
  const [copied, setCopied] = useState(false);
  const { mode } = useProductionMode();

  useEffect(() => setTvUrl(`${window.location.origin}/tv`), []);

  const todayEntries = useMemo(
    () => entries.filter((entry) => entry.entry_date === businessDate),
    [businessDate, entries],
  );
  const todayTotal = useMemo(() => sumLoads(todayEntries), [todayEntries]);
  const achievement = DAILY_TARGET > 0 ? (todayTotal / DAILY_TARGET) * 100 : 0;
  const activeShift = currentShift();
  const monthlyReport = useMemo(() => {
    const reportMonth = monthKey(businessDate);
    const range = monthRange(reportMonth);
    return buildReport(entries, range.from, range.to, monthNameFromKey(reportMonth));
  }, [businessDate, entries]);
  const hourly = SHIFTS[activeShift].slots.map((slot, index) => ({
    slot,
    loads: todayEntries.find((entry) => entry.shift === activeShift && entry.slot_index === index)?.load_count ?? 0,
  }));

  async function copyTvLink() {
    try {
      await navigator.clipboard.writeText(tvUrl);
      setCopied(true);
      toast.success("TV Mode link copied");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy the link");
    }
  }

  async function shareTvLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Phorotech PPMS TV Mode", url: tvUrl });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }
    await copyTvLink();
  }

  return (
    <div className="mobile-app-shell md:hidden">
      <header className="mobile-topbar">
        <div className="flex min-w-0 items-center gap-3">
          <img src={logoAsset.url} alt="Phorotech Surfin India" className="size-11 shrink-0 rounded-md bg-background object-contain p-0.5" />
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-foreground">PHOROTECH SURFIN INDIA</p>
            <p className="truncate text-xs font-semibold text-mobile-accent">Production Monitoring System</p>
          </div>
        </div>
        <span className={`size-2.5 shrink-0 rounded-full ${online ? "bg-success" : "bg-danger"}`} aria-label={online ? "Network online" : "Network offline"} />
      </header>

      <main className="space-y-4 px-4 pb-28 pt-4">
        {view === "dashboard" && (
          <>
            <section className="mobile-primary-card">
              <div>
                <p className="mobile-eyebrow">Today&apos;s Production</p>
                <p className="mt-1 text-xs text-muted-foreground">Business date · {businessDate}</p>
              </div>
              <div className="mt-5 grid grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] items-end gap-3">
                <div>
                  <p className="text-5xl font-black leading-none text-foreground tabular-nums">{todayTotal.toLocaleString("en-IN")}</p>
                  <p className="mt-2 text-xs font-bold uppercase text-muted-foreground">Actual loads</p>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <MobileMiniMetric label="Target" value={DAILY_TARGET.toString()} />
                  <MobileMiniMetric label="Achievement" value={`${achievement.toFixed(1)}%`} tone={achievement >= 90 ? "success" : achievement >= 60 ? "warning" : "danger"} />
                </div>
              </div>
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="mobile-section-title">Shift Performance</h2>
                <span className="text-xs text-muted-foreground">Target {SHIFT_TARGET} each</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ALL_SHIFTS.map((shift) => {
                  const total = sumLoads(todayEntries.filter((entry) => entry.shift === shift));
                  const active = shift === activeShift;
                  return (
                    <article key={shift} className={`mobile-shift-card ${active ? "mobile-shift-card-active" : ""}`}>
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-extrabold">Shift {shift === 1 ? "I" : shift === 2 ? "II" : "III"}</span>
                        {active && <span className="size-1.5 rounded-full bg-success" />}
                      </div>
                      <p className="mt-3 text-2xl font-black tabular-nums">{total}</p>
                      <p className="text-[10px] text-muted-foreground">of {SHIFT_TARGET}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="mobile-card">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="mobile-section-title">Hourly Production</h2>
                  <p className="text-xs text-muted-foreground">{SHIFTS[activeShift].label} · {SHIFTS[activeShift].range}</p>
                </div>
                <Activity className="size-5 text-mobile-accent" />
              </div>
              <div className="mt-3 divide-y divide-border">
                {hourly.map(({ slot, loads }) => (
                  <div key={slot} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                    <span className="min-w-0 truncate text-xs text-muted-foreground">{slot}</span>
                    <strong className="tabular-nums text-foreground">{loads}</strong>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-2 gap-2">
              <div className="mobile-card p-3">
                <p className="mobile-eyebrow">Mode</p>
                <p className="mt-2 font-extrabold text-foreground">{mode ? `${mode} MODE` : "—"}</p>
              </div>
              <div className="mobile-card p-3">
                <p className="mobile-eyebrow">Network Status</p>
                <div className={`mt-2 flex items-center gap-2 font-extrabold ${online ? "text-success" : "text-danger"}`}>
                  {online ? <Wifi className="size-4" /> : <WifiOff className="size-4" />}{online ? "Live" : "Offline"}
                </div>
              </div>
            </section>
          </>
        )}

        {view === "reports" && (
          <section className="space-y-4">
            <div><p className="mobile-eyebrow">Reports</p><h1 className="mt-1 font-sans text-2xl font-black">Production Reports</h1></div>
            <div className="mobile-primary-card">
              <FileText className="size-7 text-mobile-accent" />
              <h2 className="mt-4 text-lg font-extrabold">Monthly Report</h2>
              <p className="mt-1 text-sm text-muted-foreground">View or download complete production records by month or date range.</p>
              {isSignedIn ? <Button className="mt-5 h-11 w-full" onClick={onOpenReport}><FileText />Open Monthly Report</Button> : <Button asChild className="mt-5 h-11 w-full"><Link to="/auth"><LogIn />Sign in to view reports</Link></Button>}
            </div>
          </section>
        )}

        {view === "analytics" && <MobileAnalytics entries={entries} businessDate={businessDate} />}

        {view === "settings" && (
          <section className="space-y-4">
            <div><p className="mobile-eyebrow">Settings</p><h1 className="mt-1 font-sans text-2xl font-black">App & Display</h1></div>
            <div className="mobile-primary-card">
              <MonitorUp className="size-7 text-mobile-accent" />
              <h2 className="mt-4 text-lg font-extrabold">TV MODE</h2>
              <p className="mt-1 text-sm text-muted-foreground">Share the existing factory display with a TV or another device.</p>
              <p className="mt-4 truncate rounded-md border border-border bg-background/60 px-3 py-2 text-xs text-mobile-accent">{tvUrl}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="outline" className="h-11" onClick={() => void copyTvLink()}>{copied ? <Check /> : <Clipboard />}{copied ? "Copied" : "Copy Link"}</Button>
                <Button className="h-11" onClick={() => void shareTvLink()}><Share2 />Share Link</Button>
              </div>
            </div>
            {!isSignedIn && <Button asChild variant="outline" className="h-11 w-full"><Link to="/auth"><LogIn />Sign In</Link></Button>}
            {isAdmin && <Button asChild variant="outline" className="h-11 w-full"><Link to="/admin"><Shield />Admin Panel</Link></Button>}
            {isSuperAdmin && <Button asChild variant="outline" className="h-11 w-full"><Link to="/super"><Shield />Super Admin</Link></Button>}
          </section>
        )}
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <Button key={key} variant="ghost" onClick={() => setView(key)} className={`mobile-nav-button ${view === key ? "mobile-nav-button-active" : ""}`} aria-current={view === key ? "page" : undefined}>
            <Icon className="size-5" /><span>{label}</span>
          </Button>
        ))}
      </nav>
    </div>
  );
}

function MobileMiniMetric({ label, value, tone }: { label: string; value: string; tone?: "success" | "warning" | "danger" }) {
  const toneClass = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : tone === "danger" ? "text-danger" : "text-foreground";
  return <div className="mobile-mini-metric"><p className="text-[10px] font-bold uppercase text-muted-foreground">{label}</p><p className={`mt-1 text-xl font-black tabular-nums ${toneClass}`}>{value}</p></div>;
}

function MobileMonthlyMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="mobile-mini-metric min-w-0">
      <p className="text-[10px] font-bold uppercase leading-tight text-muted-foreground">{label}</p>
      <p className="mt-1.5 break-words text-lg font-black tabular-nums text-foreground">
        {typeof value === "number" ? value.toLocaleString("en-IN") : value}
      </p>
    </div>
  );
}