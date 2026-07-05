import { useStore } from "@/store/StoreProvider";
import { todayTotals } from "@/lib/logic";
import { Card } from "@/components/ui/card";
import { ProgressBar } from "@/components/ProgressBar";
import { cn, signed } from "@/lib/utils";

export function HeroMetric() {
  const { state } = useStore();
  const total = todayTotals(state).total;
  const blows = state.todayLog.filter((l) => l.type === "blew").length;
  const payouts = state.todayLog.filter((l) => l.type === "payout").length;
  const dailyTarget = state.objectives.dailyTarget;

  return (
    <Card className="px-6 py-7">
      <div className="mb-2 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">
        Today&rsquo;s P&amp;L
      </div>
      <div className={cn("font-mono text-display font-bold", total >= 0 ? "text-profit" : "text-loss")}>
        {signed(Math.round(total))}
      </div>
      <div className="mt-2 font-mono text-data-xs text-faint">
        {blows} blow{blows === 1 ? "" : "s"} · {payouts} payout{payouts === 1 ? "" : "s"} logged today
      </div>
      {dailyTarget > 0 && (
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between font-mono text-data-xs text-faint">
            <span>Daily objective</span>
            <span>{signed(dailyTarget)}</span>
          </div>
          <ProgressBar percent={(total / dailyTarget) * 100} />
        </div>
      )}
    </Card>
  );
}
