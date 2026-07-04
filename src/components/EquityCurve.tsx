import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/store/StoreProvider";
import { equityPoints } from "@/lib/stats";
import { Card } from "@/components/ui/card";
import { signed } from "@/lib/utils";

export function EquityCurve() {
  const { state } = useStore();
  const { points, total } = equityPoints(state);
  return (
    <Card className="bg-gradient-to-b from-panel to-panel2 px-5 py-4">
      <div className="mb-2 flex items-start justify-between">
        <div>
          <div className="mb-1.5 text-[0.56rem] font-medium uppercase tracking-[0.13em] text-dim">
            Total banked
          </div>
          <div className="text-[1.6rem] font-bold tracking-[-0.01em] text-live">
            {signed(Math.round(total))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[0.58rem] text-dim">
          <span className="h-2 w-2 rounded-full bg-cool shadow-[0_0_8px_var(--cool)]" />
          cumulative P&L
        </div>
      </div>
      <div className="h-[180px] w-full">
        {points.length < 2 ? (
          <div className="flex h-full items-center justify-center font-mono text-[0.66rem] text-faint">
            No banked days yet — hit "New Day" to build the curve.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
              <defs>
                <linearGradient id="eqg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--cool)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--cool)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: "var(--faint)", fontFamily: "'JetBrains Mono', monospace" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide domain={[(min: number) => Math.min(0, min), "dataMax"]} />
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
                formatter={(v: number) => [signed(Math.round(v)), "banked"]}
              />
              <Area
                type="linear"
                dataKey="val"
                stroke="var(--cool)"
                strokeWidth={2.5}
                fill="url(#eqg)"
                dot={{ r: 3, fill: "var(--cool)", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
