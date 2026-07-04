import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/store/StoreProvider";
import { packageGroups } from "@/lib/stats";
import { Card } from "@/components/ui/card";
import { signed } from "@/lib/utils";

export function PackagePerformanceChart() {
  const { state } = useStore();
  const groups = packageGroups(state);

  return (
    <Card className="p-5">
      <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">
        Package Performance
      </div>
      <div className="mb-4 font-mono text-data-xs text-faint">7-day net $ per package</div>
      <div className="h-[168px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={groups} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <XAxis
              dataKey="name"
              tick={{ fontSize: 9, fill: "var(--faint)", fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: "var(--panel2)",
                border: "1px solid var(--line2)",
                borderRadius: 8,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 11,
              }}
              labelStyle={{ color: "var(--dim)" }}
              formatter={(v: number) => signed(Math.round(v))}
            />
            <Bar dataKey="week" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={500} animationEasing="ease-out">
              {groups.map((g) => (
                <Cell key={g.hex} fill={g.week >= 0 ? "var(--profit)" : "var(--loss)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {groups.length === 0 ? (
        <div className="mt-2 font-mono text-data-xs text-faint">No packages yet.</div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-line pt-3">
          {groups.map((g) => (
            <span key={g.hex} className="flex items-center gap-1.5 font-mono text-data-xs text-dim">
              <span className="h-[8px] w-[8px] shrink-0 rounded-[2px]" style={{ background: g.hex }} />
              {g.name}
            </span>
          ))}
        </div>
      )}
    </Card>
  );
}
