import { Area, AreaChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useStore } from "@/store/StoreProvider";
import { netOfLog } from "@/lib/logic";
import { Card } from "@/components/ui/card";
import { cn, signed } from "@/lib/utils";

export function IntradayPnlChart() {
  const { state } = useStore();
  const log = state.todayLog;

  let cum = 0;
  const points =
    log.length === 0
      ? [
          { label: "start", val: 0 },
          { label: "now", val: 0 },
        ]
      : [
          { label: "start", val: 0 },
          ...log.map((w) => {
            cum += netOfLog(w);
            return { label: w.time, val: Math.round(cum * 100) / 100 };
          }),
        ];
  const current = points[points.length - 1].val;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">
            Session P&amp;L
          </div>
          <div className={cn("font-mono text-data-xl font-bold", current >= 0 ? "text-profit" : "text-loss")}>
            {signed(current)}
          </div>
          {log.length === 0 && (
            <div className="mt-1 font-mono text-data-xs text-faint">No trades logged yet today.</div>
          )}
        </div>
        <div className="font-mono text-data-xs text-faint">intraday · {log.length} entries</div>
      </div>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 8 }}>
            <defs>
              <linearGradient id="intraday-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--ink)" stopOpacity={0.22} />
                <stop offset="100%" stopColor="var(--ink)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: "var(--faint)", fontFamily: "'JetBrains Mono', monospace" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide domain={[(min: number) => Math.min(0, min), (max: number) => Math.max(0, max)]} />
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
              formatter={(v: number) => [signed(v), "P&L"]}
            />
            <Area
              type="linear"
              dataKey="val"
              stroke="var(--ink)"
              strokeWidth={2.5}
              fill="url(#intraday-fill)"
              dot={{ r: 3, fill: "var(--ink)", strokeWidth: 0 }}
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
