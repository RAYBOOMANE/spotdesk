import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/store/StoreProvider";
import { computeTopStats } from "@/lib/stats";
import { Card } from "@/components/ui/card";

export function DeployedCapitalChart() {
  const { state } = useStore();
  const s = computeTopStats(state);
  const recent = state.history.slice(-9).map((d) => ({ label: "D" + d.day, val: d.deployed || 0 }));
  const points = [...recent, { label: "Today", val: s.deployed }];

  return (
    <Card className="p-5">
      <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">
        Deployed Capital
      </div>
      <div className="mb-4 font-mono text-data-xl font-bold text-ink">${s.deployed.toLocaleString()}</div>
      <div className="h-[168px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="deployed-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--dim)" stopOpacity={0.25} />
                <stop offset="100%" stopColor="var(--dim)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "var(--faint)", fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[0, "dataMax"]} />
            <Tooltip
              contentStyle={{
                background: "var(--panel2)",
                border: "1px solid var(--line2)",
                borderRadius: 8,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
              }}
              labelStyle={{ color: "var(--dim)" }}
              formatter={(v: number) => ["$" + Math.round(v).toLocaleString(), "deployed"]}
            />
            <Area
              type="monotone"
              dataKey="val"
              stroke="var(--dim)"
              strokeWidth={2}
              fill="url(#deployed-fill)"
              dot={{ r: 2.5, fill: "var(--dim)", strokeWidth: 0 }}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {recent.length === 0 && (
        <div className="mt-2 font-mono text-data-xs text-faint">No banked days yet — trend builds over time.</div>
      )}
    </Card>
  );
}
