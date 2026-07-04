import { Card } from "@/components/ui/card";
import { useStore } from "@/store/StoreProvider";
import { packageGroups } from "@/lib/stats";
import { cn } from "@/lib/utils";

export function Packages() {
  const { state } = useStore();
  const groups = packageGroups(state);
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
      {groups.map((g) => (
        <Card key={g.hex} className="p-3.5" style={{ borderTop: `2px solid ${g.hex}` }}>
          <div className="mb-1.5 flex items-center gap-2">
            <span className="h-[10px] w-[10px] rounded-[3px]" style={{ background: g.hex }} />
            <span className="text-[0.74rem] font-bold">{g.name} package</span>
            <span className="ml-auto font-mono text-[0.58rem] text-faint">
              {g.clusters.length} cluster{g.clusters.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="mb-2.5 line-clamp-2 min-h-[1.5em] font-mono text-[0.58rem] leading-relaxed text-dim">
            {g.clusterLabels}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-panel2 px-2.5 py-2">
              <div className="text-[0.5rem] uppercase tracking-[0.1em] text-faint">Today</div>
              <div className={cn("font-mono text-[0.9rem] font-bold", g.today >= 0 ? "text-profit" : "text-loss")}>
                {g.today >= 0 ? "+" : ""}${Math.round(g.today).toLocaleString()}
              </div>
            </div>
            <div className="rounded-lg bg-panel2 px-2.5 py-2">
              <div className="text-[0.5rem] uppercase tracking-[0.1em] text-faint">7 days</div>
              <div className={cn("font-mono text-[0.9rem] font-bold", g.week >= 0 ? "text-profit" : "text-loss")}>
                {g.week >= 0 ? "+" : ""}${Math.round(g.week).toLocaleString()}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
