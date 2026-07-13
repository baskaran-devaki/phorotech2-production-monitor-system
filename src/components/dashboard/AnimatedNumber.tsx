import { useEffect, useRef, useState } from "react";

export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const start = prev.current;
    const diff = value - start;
    if (diff === 0) return;
    const duration = 800;
    const startTs = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - startTs) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + diff * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
      else prev.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={className}>{display.toLocaleString("en-IN")}</span>;
}
