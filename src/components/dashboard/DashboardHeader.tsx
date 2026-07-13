import { useClock } from "@/hooks/useProduction";
import { SHIFTS, currentShift, monthName } from "@/lib/production";
import { Link } from "@tanstack/react-router";
import { Factory, LogIn, Shield } from "lucide-react";

export function DashboardHeader({ isAdmin, isSignedIn }: { isAdmin: boolean; isSignedIn: boolean }) {
  const now = useClock();
  const shift = currentShift(now);

  return (
    <header className="relative z-10 fade-up">
      <div className="glass-gold rounded-3xl p-6 md:p-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
          <div className="min-w-0 flex items-start gap-4">
            <div className="hidden sm:grid shrink-0 h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[oklch(0.88_0.16_90)] to-[oklch(0.58_0.12_70)] gold-glow">
              <Factory className="h-7 w-7 text-[oklch(0.12_0.005_60)]" />
            </div>
            <div className="min-w-0">
              <h1 className="display gold-text text-2xl sm:text-3xl md:text-5xl font-bold leading-tight truncate">
                PHOROTECH SURFIN INDIA PVT LTD
              </h1>
              <p className="mt-1 text-sm sm:text-base text-[color:var(--gold-light)] tracking-[0.3em] uppercase truncate">
                PLANT&nbsp;II · ED PLANT · IRUNGATTUKOTTAI
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2 shrink-0">
            {isSignedIn ? (
              isAdmin && (
                <Link to="/admin" className="btn-gold rounded-xl px-3 py-2 text-xs sm:text-sm inline-flex items-center gap-2">
                  <Shield className="h-4 w-4" /> <span className="hidden sm:inline">Admin Panel</span>
                </Link>
              )
            ) : (
              <Link to="/auth" className="btn-gold rounded-xl px-3 py-2 text-xs sm:text-sm inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" /> <span className="hidden sm:inline">Admin Login</span>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Date" value={now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} />
          <Stat label="Time" value={now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })} pulse />
          <Stat label="Current Shift" value={`${SHIFTS[shift].label}`} sub={SHIFTS[shift].range} />
          <Stat label="Month" value={monthName(now)} />
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, sub, pulse }: { label: string; value: string; sub?: string; pulse?: boolean }) {
  return (
    <div className={`glass-dark rounded-2xl p-3 md:p-4 ${pulse ? "pulse-gold" : ""}`}>
      <div className="text-[10px] md:text-xs uppercase tracking-widest text-[color:var(--muted-foreground)]">{label}</div>
      <div className="mt-1 font-display text-lg md:text-2xl gold-text truncate">{value}</div>
      {sub && <div className="text-[10px] md:text-xs text-[color:var(--muted-foreground)] truncate">{sub}</div>}
    </div>
  );
}
