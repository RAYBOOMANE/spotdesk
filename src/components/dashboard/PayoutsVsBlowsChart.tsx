import { Bar, BarChart, Cell, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/store/StoreProvider";
import { todayTotals } from "@/lib/logic";
import { Card } from "@/components/ui/card";
import { signed } from "@/lib/utils";

export function PayoutsVsBlowsChart() {
  const { state } = useStore();
  const recent = state.history.slice(-7).map((d) => ({
    label: "D" + d.day,
    profit: d.profit || 0,
    payouts: d.payouts || 0,
  }));
  const todayTt = todayTotals(state);
  const data = [...recent, { label: "Today", profit: todayTt.profit, payouts: todayTt.payouts }];
  const isEmpty = state.history.length === 0 && state.todayLog.length === 0;

  return (
    <Card className="p-5">
      <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">
        Payouts vs Blows
      </div>
      <div className="mb-4 font-mono text-data-xs text-faint">last 7 days + today, net $ each</div>
      <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 9, fill: "var(--faint)", fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <ReferenceLine y={0} stroke="var(--line2)" strokeDasharray="3 3" />
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
            <Legend formatter={(value) => <span style={{ color: "var(--dim)", fontSize: "0.6rem" }}>{value}</span>} />
            <Bar dataKey="profit" name="Blows" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={500} animationEasing="ease-out">
              {data.map((d, i) => (
                <Cell key={i} fill={d.profit >= 0 ? "var(--profit)" : "var(--loss)"} />
              ))}
            </Bar>
            <Bar dataKey="payouts" name="Payouts" radius={[3, 3, 0, 0]} isAnimationActive animationDuration={500} animationEasing="ease-out">
              {data.map((d, i) => (
                <Cell key={i} fill={d.payouts >= 0 ? "var(--profit)" : "var(--loss)"} fillOpacity={0.6} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {isEmpty && <div className="mt-2 font-mono text-data-xs text-faint">Nothing logged yet.</div>}
    </Card>
  );
}
