import { useStore } from "@/store/StoreProvider";
import { Card } from "@/components/ui/card";
import { cn, signed } from "@/lib/utils";

export function HeroMetric() {
  const { state } = useStore();
  const total = state.todayProfit + state.todayPayouts;
  const blows = state.todayLog.filter((l) => l.type === "blew").length;
  const payouts = state.todayLog.filter((l) => l.type === "payout").length;

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
    </Card>
  );
}
