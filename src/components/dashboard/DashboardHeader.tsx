import { useEffect, useState } from "react";
import { SHIFTS, currentShift, monthName } from "@/lib/production";
import { Link } from "@tanstack/react-router";
import { LogIn, Shield, Tv } from "lucide-react";
import logoAsset from "@/assets/phorotech-logo.jpg.asset.json";

export function DashboardHeader({ isAdmin, isSignedIn }: { isAdmin: boolean; isSignedIn: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const shift = now ? currentShift(now) : 1;

  return (
    <header className="relative z-10 fade-up">
      <div className="glass-gold rounded-3xl p-6 md:p-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4 items-start">
          <div className="min-w-0 flex items-start gap-4">
            <div className="shrink-0 h-16 w-16 sm:h-20 sm:w-20 rounded-2xl overflow-hidden bg-white p-1.5 border border-[oklch(0.78_0.14_82/30%)]">
              <img src={logoAsset.url} alt="Phorotech Surfin India" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <h1 className="font-[family-name:var(--font-display)] title-text text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight tracking-wide">
                PHOROTECH SURFIN INDIA PVT LTD
              </h1>
              <p className="mt-2 text-sm sm:text-base md:text-lg text-[color:var(--cyan)] font-bold tracking-[0.25em] uppercase truncate">
                Plant II · ED Plant · Irungattukottai
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
              <Link to="/auth" className="btn-outline-gold rounded-xl px-3 py-2 text-xs sm:text-sm inline-flex items-center gap-2">
                <LogIn className="h-4 w-4" /> <span className="hidden sm:inline">Admin Login</span>
              </Link>
            )}
            <a href="/tv" target="_blank" rel="noopener" className="btn-outline-gold rounded-xl px-3 py-2 text-xs sm:text-sm inline-flex items-center gap-2">
              <Tv className="h-4 w-4" /> <span className="hidden sm:inline">TV Mode</span>
            </a>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3" suppressHydrationWarning>
          <Stat label="Date" value={now ? now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"} />
          <Stat label="Time" value={now ? now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) : "—"} pulse />
          <Stat label="Current Shift" value={now ? SHIFTS[shift].label : "—"} sub={now ? SHIFTS[shift].range : ""} accent />
          <Stat label="Month" value={now ? monthName(now) : "—"} />
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value, sub, pulse, accent }: { label: string; value: string; sub?: string; pulse?: boolean; accent?: boolean }) {
  return (
    <div className={`glass-dark rounded-2xl p-4 md:p-5 ${pulse ? "gold-glow" : ""}`}>
      <div className="text-xs md:text-sm uppercase tracking-widest text-[color:var(--muted-foreground)] font-bold">{label}</div>
      <div className={`mt-1 font-[family-name:var(--font-mono)] text-xl md:text-3xl font-bold truncate ${accent ? "text-[color:var(--cyan)]" : "gold-text"}`}>{value}</div>
      {sub && <div className="text-xs md:text-sm text-[color:var(--muted-foreground)] truncate mt-1 font-mono">{sub}</div>}
    </div>
  );
}

