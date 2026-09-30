import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TotalCard } from "@/components/dashboard/TotalCard";
import { ShiftCard } from "@/components/dashboard/ShiftCard";
import { HighestCard } from "@/components/dashboard/HighestCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { useAuthUser, useProductionEntries } from "@/hooks/useProduction";
import {
  ALL_SHIFTS, businessDate, currentMonthKey, dailyTotalsForMonth,
  highestOfMonth, monthKey, monthName, sumLoads,
} from "@/lib/production";
import { ReportDialog } from "@/components/report/ReportDialog";
import { FileText, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { MobileProductionDashboard } from "@/components/mobile/MobileProductionDashboard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PPMS Production Dashboard · Phorotech Surfin India" },
      { name: "description", content: "Live production performance, shift totals, hourly output, reports, and plant network status for Phorotech Surfin India." },
      { property: "og:title", content: "PPMS Production Dashboard · Phorotech Surfin India" },
      { property: "og:description", content: "Live production performance and plant monitoring for Phorotech Surfin India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { entries, loading, lastUpdated, online } = useProductionEntries();
  const { user, isAdmin, isSuperAdmin } = useAuthUser();
  const [tick, setTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  useEffect(() => setMounted(true), []);



  const mKey = currentMonthKey();
  const bDate = businessDate();

  const monthEntries = useMemo(() => entries.filter((e) => monthKey(e.entry_date) === mKey), [entries, mKey, tick]);
  const monthlyTotal = sumLoads(monthEntries);
  const highest = useMemo(() => highestOfMonth(entries, mKey), [entries, mKey]);
  const trend = useMemo(() => dailyTotalsForMonth(entries, mKey), [entries, mKey]);

  return (
    <>
      <MobileProductionDashboard
        entries={entries}
        businessDate={bDate}
        monthLabel={monthName()}
        monthlyTotal={monthlyTotal}
        online={online}
        isSignedIn={!!user}
        isAdmin={isAdmin}
        isSuperAdmin={isSuperAdmin}
        onOpenReport={() => setReportOpen(true)}
      />
      <main className="relative z-10 mx-auto hidden max-w-7xl px-3 py-4 sm:px-6 sm:py-6 md:block md:space-y-6">
      <DashboardHeader isAdmin={isAdmin} isSignedIn={!!user} isSuperAdmin={isSuperAdmin} />

      <TotalCard total={monthlyTotal} month={monthName()} />

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ALL_SHIFTS.map((s) => (
          <ShiftCard key={s} shift={s} entries={entries} businessDate={bDate} />
        ))}
      </section>

      <section className="space-y-4">
        <TrendChart data={trend} />
        <HighestCard record={highest} />
      </section>

      <section className="glass-dark rounded-3xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[color:var(--muted-foreground)] min-w-0">
          {online ? <Wifi className="h-4 w-4 text-[color:var(--gold-light)] shrink-0" /> : <WifiOff className="h-4 w-4 text-destructive shrink-0" />}
          <span className="font-semibold">{online ? "Live" : "Offline"}</span>
          <span className="opacity-40">·</span>
          <span className="break-words">Updated {mounted ? lastUpdated.toLocaleTimeString("en-IN") : "—"}</span>
          {loading && <span className="opacity-60">· loading…</span>}
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 min-w-0">
          <button onClick={() => { setTick((n) => n + 1); toast.success("Dashboard refreshed"); }}
            className="rounded-xl border border-[color:var(--border)] px-3 py-2 text-xs sm:text-sm inline-flex items-center justify-center gap-2 hover:bg-[oklch(0.78_0.14_82/10%)] transition">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {user && (
            <button onClick={() => setReportOpen(true)}
              className="btn-gold rounded-xl px-4 py-2 text-xs sm:text-sm inline-flex items-center justify-center gap-2">
              <FileText className="h-4 w-4" /> Monthly Report
            </button>
          )}
        </div>
      </section>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        generatedBy={user?.email ?? "Guest"}
      />


      <footer className="text-center text-xs text-[color:var(--muted-foreground)] pt-2 pb-6">
        © {new Date().getFullYear()} Phorotech Surfin India Pvt Ltd · Plant II · ED Plant · Irungattukottai
      </footer>
      </main>
    </>
  );
}
