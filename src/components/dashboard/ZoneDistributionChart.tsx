import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useStore } from "@/store/StoreProvider";
import { zoneCounts } from "@/lib/stats";
import { Card } from "@/components/ui/card";

const SLICES: { key: "live" | "deep" | "cool" | "gold"; label: string; fill: string }[] = [
  { key: "live", label: "D1–3", fill: "var(--ink)" },
  { key: "deep", label: "D4–7 deep", fill: "var(--dim)" },
  { key: "cool", label: "D9–13", fill: "var(--faint)" },
  { key: "gold", label: "D8 / D14", fill: "var(--line2)" },
];

export function ZoneDistributionChart() {
  const { state } = useStore();
  const counts = zoneCounts(state);
  const data = SLICES.map((s) => ({ name: s.label, value: counts[s.key], fill: s.fill }));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="p-5">
      <div className="mb-1.5 text-[0.56rem] font-medium uppercase tracking-[0.13em] text-dim">Zone Distribution</div>
      <div className="mb-4 font-mono text-[0.6rem] text-faint">live accounts by ladder zone</div>
      <div className="relative h-[200px] w-full">
        {total === 0 ? (
          <div className="flex h-full items-center justify-center font-mono text-[0.66rem] text-faint">
            No live accounts yet.
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={2}>
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.fill} stroke="var(--panel)" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--panel2)",
                    border: "1px solid var(--line2)",
                    borderRadius: 8,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                  }}
                  labelStyle={{ color: "var(--dim)" }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={24}
                  formatter={(value) => <span style={{ color: "var(--dim)", fontSize: "0.6rem" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="font-mono text-xl font-bold text-ink">{total}</div>
              <div className="font-mono text-[0.5rem] uppercase tracking-[0.1em] text-faint">live</div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
