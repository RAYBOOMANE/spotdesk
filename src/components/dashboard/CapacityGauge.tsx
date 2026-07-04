import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import { useStore } from "@/store/StoreProvider";
import { computeTopStats } from "@/lib/stats";
import { Card } from "@/components/ui/card";

export function CapacityGauge({ onClick }: { onClick: () => void }) {
  const { state } = useStore();
  const s = computeTopStats(state);
  const pct = Math.min(100, s.capPct);

  return (
    <Card onClick={onClick} className="p-5">
      <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">
        Capacity Used
      </div>
      <div className="mb-2 font-mono text-data-xs text-faint">{s.capLabel} — click to configure</div>
      <div className="relative h-[168px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="72%"
            outerRadius="100%"
            barSize={12}
            data={[{ value: pct }]}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: "var(--panel2)" }}
              dataKey="value"
              cornerRadius={6}
              fill="var(--ink)"
              isAnimationActive
              animationDuration={500}
              animationEasing="ease-out"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono text-data-xl font-bold text-ink">{s.capPct.toFixed(0)}%</div>
          <div className="font-mono text-data-xs text-faint">used</div>
        </div>
      </div>
    </Card>
  );
}
