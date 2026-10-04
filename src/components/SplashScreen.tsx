import { useEffect, useState } from "react";
import logoAsset from "@/assets/phorotech-logo.jpg.asset.json";

export function SplashScreen() {
  const [phase, setPhase] = useState<"show" | "fade" | "gone">("show");

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("fade"), 900);
    const t2 = window.setTimeout(() => setPhase("gone"), 1400);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, []);

  if (phase === "gone") return null;

  return (
    <div className={`splash-screen ${phase === "fade" ? "splash-fade" : ""}`} role="status" aria-label="Loading PPMS">
      <div className="splash-logo-wrap">
        <img src={logoAsset.url} alt="Phorotech Surfin India" className="splash-logo" />
      </div>
      <p className="splash-title">PPMS</p>
      <p className="splash-subtitle">Production Performance Monitoring System</p>
      <div className="splash-bar"><span /></div>
    </div>
  );
}
