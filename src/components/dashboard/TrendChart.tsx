import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";

export function TrendChart({ data }: { data: Array<{ date: string; loads: number }> }) {
  const display = data.map((d) => ({
    day: d.date.slice(8),
    loads: d.loads,
  }));

  return (
    <div className="glass-gold rounded-3xl p-5 md:p-6 fade-up">
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h3 className="display text-xl md:text-2xl gold-text">Production Trend</h3>
          <p className="text-xs text-[color:var(--muted-foreground)]">Daily loads · current month</p>
        </div>
      </div>
      <div className="h-56 md:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={display} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFD700" stopOpacity={0.6} />
                <stop offset="100%" stopColor="#D4AF37" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#D4AF37" strokeOpacity={0.1} vertical={false} />
            <XAxis dataKey="day" stroke="#B8B8B8" fontSize={11} />
            <YAxis stroke="#B8B8B8" fontSize={11} />
            <Tooltip
              contentStyle={{ background: "#0B0B0B", border: "1px solid #D4AF37", borderRadius: 12, color: "#FFD700" }}
              labelStyle={{ color: "#FFD700" }}
            />
            <Area type="monotone" dataKey="loads" stroke="#FFD700" strokeWidth={2} fill="url(#gold)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
