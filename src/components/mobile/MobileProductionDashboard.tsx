import { Link, getRouteApi, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronDown,
  LoaderCircle,
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
import logoUrl from "@/assets/phorotech-logo.jpeg";
const logoAsset = { url: logoUrl };
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchAllProductionEntries } from "@/lib/production-data";
import { datesWithProduction, entriesForBusinessDate, hourlyForShift } from "@/lib/mobile-production";
import { useClock } from "@/hooks/useProduction";
import { supabase } from "@/integrations/supabase/client";
import { KeyRound } from "lucide-react";
import { useProductionMode } from "@/hooks/useProductionMode";
import {
  ALL_SHIFTS,
  DAILY_TARGET,
  SHIFTS,
  SHIFT_TARGET,
  currentShift,
  businessDate as getBusinessDate,
  sumLoads,
  type ProductionEntry,
} from "@/lib/production";
import { MobileAnalytics } from "./MobileAnalytics";

type MobileView = "dashboard" | "reports" | "analytics" | "settings";

interface MobileProductionDashboardProps {
  entries: ProductionEntry[];
  loading: boolean;
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
  loading,
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
  const [calendarOpen, setCalendarOpen] = useState(false);
  const navigate = useNavigate({ from: "/" });
  const { mobileDate, mobileShift } = getRouteApi("/").useSearch();
  const now = useClock();
  const currentDate = getBusinessDate(now);
  const selectedDate = mobileDate ?? currentDate;
  const activeShift = currentShift(now);
  const selectedShift = mobileShift ?? (selectedDate === currentDate ? activeShift : 1);
  const isCurrentDate = selectedDate === currentDate;
  const historical = useQuery({
    queryKey: ["mobile-production-day", selectedDate],
    queryFn: () => fetchAllProductionEntries({ from: selectedDate, to: selectedDate }),
    enabled: !isCurrentDate,
  });
  const dayLoading = isCurrentDate ? loading : historical.isPending;
  const dayError = !isCurrentDate && historical.isError;
  const productionDates = useMemo(() => datesWithProduction(entries), [entries]);
  const { mode } = useProductionMode();

  useEffect(() => setTvUrl(`${window.location.origin}/tv`), []);

  const todayEntries = useMemo(
    () => entriesForBusinessDate(isCurrentDate ? entries : historical.data ?? [], selectedDate),
    [selectedDate, isCurrentDate, historical.data, entries],
  );
  const todayTotal = useMemo(() => sumLoads(todayEntries), [todayEntries]);
  const achievement = DAILY_TARGET > 0 ? (todayTotal / DAILY_TARGET) * 100 : 0;
  const hourly = hourlyForShift(todayEntries, selectedDate, selectedShift);
  const shiftHasProduction = todayEntries.some((entry) => entry.shift === selectedShift && entry.load_count > 0);

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
            <section className="neon-card text-center">
              <p className="text-base font-black uppercase tracking-wide text-mobile-accent" style={{ textShadow: "0 0 12px var(--neon-blue)" }}>{isCurrentDate ? "Today's Production" : "Daily Production"}</p>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="mt-1 h-auto min-h-11 w-full flex-wrap gap-2 text-sm" aria-label="Select business date">
                    <CalendarDays className="size-4 shrink-0 text-mobile-accent" />
                    <span>Business date · {selectedDate}</span><ChevronDown className="size-4 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="center" className="mobile-production-calendar w-auto max-w-[calc(100vw-2rem)] p-0">
                  <Calendar mode="single" selected={parseISO(selectedDate)} defaultMonth={parseISO(selectedDate)}
                    className="pointer-events-auto" disabled={{ after: parseISO(currentDate) }}
                    modifiers={loading ? {} : {
                      production: (date) => productionDates.has(format(date, "yyyy-MM-dd")),
                      empty: (date) => format(date, "yyyy-MM-dd") <= currentDate && !productionDates.has(format(date, "yyyy-MM-dd")),
                    }}
                    modifiersClassNames={{ production: "production-calendar-day", empty: "empty-calendar-day" }}
                    onSelect={(date) => {
                      if (!date) return;
                      const value = format(date, "yyyy-MM-dd");
                      void navigate({ search: (previous) => ({ ...previous, mobileDate: value === currentDate ? undefined : value, mobileShift: undefined }) });
                      setCalendarOpen(false);
                    }} />
                  <div className="flex flex-wrap justify-center gap-3 border-t border-border px-3 py-3 text-xs">
                    {loading ? <span role="status">Loading production dates…</span> : <><span className="text-success">● Production</span><span className="text-muted-foreground">● No production</span></>}
                  </div>
                </PopoverContent>
              </Popover>
              <p className="text-xs font-semibold text-mobile-accent">{isCurrentDate ? "Current business day" : "Historical business day"} · 06:00 AM – 06:00 AM</p>
              {dayError ? <div role="alert" className="mt-4 text-sm text-danger">Unable to load production.<Button variant="ghost" onClick={() => void historical.refetch()}>Retry</Button></div> : <>
              <p className="neon-text mt-4 flex min-h-16 items-center justify-center text-6xl font-black leading-none tabular-nums" aria-live="polite">{dayLoading ? <LoaderCircle aria-label="Loading production" className="size-10 animate-spin motion-reduce:animate-none" /> : todayTotal.toLocaleString("en-IN")}</p>
              <p className="mt-2 text-sm font-extrabold uppercase tracking-wider" style={{ color: "var(--neon-green)", textShadow: "0 0 10px var(--neon-green)" }}>Actual Loads</p>
              {!dayLoading && todayTotal === 0 && <p role="status" className="mt-3 text-sm text-muted-foreground">No production for {selectedDate}</p>}
              <div className="mt-4 grid grid-cols-2 gap-2 text-left">
                <NeonMetric label="Target" value={DAILY_TARGET.toString()} color="var(--neon-orange)" />
                <NeonMetric label="Achievement" value={dayLoading ? "—" : `${achievement.toFixed(1)}%`} color={achievement >= 90 ? "var(--neon-green)" : achievement >= 60 ? "var(--neon-orange)" : "var(--neon-red)"} />
              </div>
              </>}
            </section>

            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="mobile-section-title">Shift Performance</h2>
                <span className="text-xs text-muted-foreground">Target {SHIFT_TARGET} each</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {ALL_SHIFTS.map((shift) => {
                  const total = sumLoads(todayEntries.filter((entry) => entry.shift === shift));
                  const active = isCurrentDate && shift === activeShift;
                  return (
                    <Button key={shift} variant="ghost" aria-label={`View Shift ${shift} hourly production`} aria-pressed={selectedShift === shift}
                      onClick={() => void navigate({ search: (previous) => ({ ...previous, mobileShift: shift }) })}
                      className={`mobile-shift-selector mobile-shift-${shift}`}>
                      <span className="flex w-full items-center justify-between gap-1">
                        <span className="text-xs font-extrabold">Shift {shift === 1 ? "I" : shift === 2 ? "II" : "III"}</span>
                        {active && <span className="size-2 rounded-full bg-success" aria-label="Live shift" />}
                      </span>
                      <span className="mt-2 text-2xl font-black tabular-nums">{dayLoading || dayError ? "—" : total}</span>
                      <span className="text-[10px] text-muted-foreground">of {SHIFT_TARGET}</span>
                    </Button>
                  );
                })}
              </div>
            </section>

            <section className="neon-card" aria-label="Selected shift hourly production" aria-busy={dayLoading}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="mobile-section-title">Hourly Production</h2>
                  <p className="text-xs text-muted-foreground">{SHIFTS[selectedShift].label} · {SHIFTS[selectedShift].range}</p>
                  <p className="mt-1 text-xs font-semibold text-mobile-accent">{selectedDate}{isCurrentDate && selectedShift === activeShift ? " · Live" : ""}</p>
                  {selectedShift === 3 && <p className="mt-1 text-xs text-muted-foreground">Ends at 06:00 AM the following day</p>}
                </div>
                <Activity className="size-5 text-mobile-accent" style={{ filter: "drop-shadow(0 0 6px var(--neon-blue))" }} />
              </div>
              {dayLoading ? <p role="status" className="py-6 text-center text-sm text-muted-foreground">Loading hourly production…</p> : dayError ? <p className="py-4 text-sm text-danger">Hourly production unavailable</p> : <>
              {!shiftHasProduction && <p className="mt-3 text-sm text-muted-foreground">No production in this shift for {selectedDate}</p>}
              <div className="mt-3 divide-y divide-border">
                {hourly.map(({ slot, loads }) => (
                  <div key={slot} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2.5">
                    <span className="min-w-0 truncate text-xs text-muted-foreground">{slot}</span>
                    <strong className="tabular-nums" style={{ color: loads > 0 ? "var(--neon-green)" : "var(--muted-foreground)", textShadow: loads > 0 ? "0 0 8px var(--neon-green)" : undefined }}>{loads}</strong>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between border-t border-border pt-3 text-sm font-bold"><span>Shift total</span><span className="tabular-nums text-success">{sumLoads(todayEntries.filter((entry) => entry.shift === selectedShift))}</span></div>
              </>}
            </section>

            <section className="grid grid-cols-2 gap-2">
              <div className="neon-card p-3">
                <p className="mobile-eyebrow">Mode</p>
                <p className="mt-2 font-extrabold" style={{ color: "var(--neon-orange)", textShadow: "0 0 8px var(--neon-orange)" }}>{mode ? `${mode} MODE` : "—"}</p>
              </div>
              <div className="neon-card p-3">
                <p className="mobile-eyebrow">Network Status</p>
                <div className={`mt-2 flex items-center gap-2 font-extrabold ${online ? "text-success" : "text-danger"}`} style={{ textShadow: `0 0 8px ${online ? "var(--neon-green)" : "var(--neon-red)"}` }}>
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
            {isSignedIn && <MobilePasswordChange />}
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

function NeonMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border p-3 text-center" style={{ borderColor: `color-mix(in oklab, ${color} 50%, transparent)`, background: `color-mix(in oklab, ${color} 10%, transparent)` }}>
      <p className="text-xs font-bold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums" style={{ color, textShadow: `0 0 10px ${color}` }}>{value}</p>
    </div>
  );
}

function MobilePasswordChange() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8 || !/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw) || !/[^A-Za-z0-9]/.test(pw)) {
      toast.error("Use 8+ characters with upper, lower, number and special character");
      return;
    }
    if (pw !== confirm) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setPw(""); setConfirm("");
    toast.success("Password changed successfully");
  }

  return (
    <form onSubmit={submit} className="neon-card space-y-3">
      <KeyRound className="size-7 text-mobile-accent" />
      <h2 className="text-lg font-extrabold">Change Password</h2>
      <Input type="password" autoComplete="new-password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-11" />
      <Input type="password" autoComplete="new-password" placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="h-11" />
      <Button type="submit" className="h-11 w-full" disabled={busy || !pw}>{busy ? "Updating…" : "Update Password"}</Button>
    </form>
  );
}

