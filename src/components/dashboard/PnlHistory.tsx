import { Card } from "@/components/ui/card";
import { useStore } from "@/store/StoreProvider";
import { cn } from "@/lib/utils";

export function PnlHistory({ onOpenDay }: { onOpenDay: (idx: number) => void }) {
  const { state } = useStore();
  const hist = state.history;

  if (hist.length === 0)
    return (
      <Card className="p-4 text-center font-mono text-[0.66rem] text-faint">
        No banked days yet. Hit "New Day" at the end of your trading day.
      </Card>
    );

  const maxAbs = Math.max(...hist.map((d) => Math.abs(d.total)), 1);
  const totalProfit = hist.reduce((s, d) => s + d.total, 0);
  const totalPayouts = hist.reduce((s, d) => s + (d.payouts || 0), 0);
  const best = Math.max(...hist.map((d) => d.total));

  return (
    <Card className="p-4">
      <div className="mb-3 flex h-[132px] items-end gap-1 overflow-x-auto pb-1">
        {hist.map((d, idx) => {
          const h = Math.max(4, (Math.abs(d.total) / maxAbs) * 100);
          return (
            <button
              key={idx}
              onClick={() => onOpenDay(idx)}
              className="group flex min-w-[26px] flex-1 flex-col items-center justify-end gap-1 self-stretch"
              title={`Day ${d.day}: ${d.total >= 0 ? "+" : ""}$${d.total.toLocaleString()} — click to view / edit`}
            >
              <span
                className={cn(
                  "font-mono text-[0.5rem] opacity-0 transition-opacity group-hover:opacity-100",
                  d.total >= 0 ? "text-profit" : "text-loss"
                )}
              >
                {d.total >= 0 ? "+" : ""}
                {Math.round(d.total)}
              </span>
              <span
                className={cn(
                  "w-full rounded-t-[3px] transition-all group-hover:brightness-125",
                  d.total >= 0 ? "bg-profit/70" : "bg-loss/70"
                )}
                style={{ height: h + "%" }}
              />
              <span className="font-mono text-[0.5rem] text-faint">D{d.day}</span>
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-2 border-t border-line pt-3 font-mono text-[0.64rem] sm:grid-cols-5">
        <div>
          <div className="text-[0.5rem] uppercase tracking-[0.1em] text-faint">Days</div>
          <div className="text-[0.85rem] font-bold text-ink">{hist.length}</div>
        </div>
        <div>
          <div className="text-[0.5rem] uppercase tracking-[0.1em] text-faint">Total profit</div>
          <div className={cn("text-[0.85rem] font-bold", totalProfit >= 0 ? "text-profit" : "text-loss")}>
            {totalProfit >= 0 ? "+" : ""}${Math.round(totalProfit).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[0.5rem] uppercase tracking-[0.1em] text-faint">Avg / day</div>
          <div className="text-[0.85rem] font-bold text-ink">
            ${Math.round(totalProfit / hist.length).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[0.5rem] uppercase tracking-[0.1em] text-faint">From payouts</div>
          <div className="text-[0.85rem] font-bold text-profit">
            +${Math.round(totalPayouts).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[0.5rem] uppercase tracking-[0.1em] text-faint">Best day</div>
          <div className="text-[0.85rem] font-bold text-profit">+${Math.round(best).toLocaleString()}</div>
        </div>
      </div>
      <div className="mt-2 font-mono text-[0.54rem] text-faint">click a bar to view / edit that day</div>
    </Card>
  );
}
