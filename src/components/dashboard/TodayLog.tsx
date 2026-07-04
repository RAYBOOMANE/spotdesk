import { Card } from "@/components/ui/card";
import { useStore } from "@/store/StoreProvider";
import { useDialogs } from "@/components/ConfirmProvider";
import { netOfLog } from "@/lib/logic";
import { cn } from "@/lib/utils";

export function TodayLog() {
  const store = useStore();
  const dialogs = useDialogs();
  const log = store.state.todayLog;

  const del = async (idx: number) => {
    const w = store.state.todayLog[idx];
    if (!w) return;
    const ok = await dialogs.confirm(
      `Delete this ${w.type} entry for C${w.id.split("-")[0]}·A${w.id.split("-")[1]} (+$${netOfLog(
        w
      ).toLocaleString()})?\nToday's totals will be adjusted back.`,
      { confirmLabel: "Delete entry", danger: true }
    );
    if (ok) store.deleteLog(idx);
  };

  return (
    <Card className="overflow-hidden">
      {log.length === 0 ? (
        <div className="p-4 text-center font-mono text-[0.66rem] text-faint">Nothing logged yet today.</div>
      ) : (
        <div className="flex max-h-[300px] flex-col overflow-y-auto p-2">
          {log
            .map((w, idx) => ({ w, idx }))
            .reverse()
            .map(({ w, idx }) => {
              const net = netOfLog(w);
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 border-b border-line/40 px-2.5 py-2 font-mono text-[0.68rem] last:border-0"
                >
                  <span className="w-[46px] shrink-0 text-faint">{w.time}</span>
                  <span className="w-[66px] shrink-0 text-dim">
                    C{w.id.split("-")[0]}·A{w.id.split("-")[1]}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-ink">
                    {w.type === "payout" ? (
                      <>
                        <span className="rounded bg-panel2 px-1.5 py-0.5 text-[0.58rem] font-bold text-dim">
                          payout on
                        </span>{" "}
                        D{w.day}{" "}
                        <span className="text-[0.58rem] text-faint">
                          (${w.amount.toLocaleString()} − ${(w.invested ?? 0).toLocaleString()} inv)
                        </span>
                      </>
                    ) : (
                      <>
                        blew on D{w.day}{" "}
                        <span className="text-[0.58rem] text-faint">
                          (${w.amount.toLocaleString()} − ${(w.sunk ?? 0).toLocaleString()} inv)
                        </span>
                      </>
                    )}
                  </span>
                  <span className={cn("shrink-0 font-bold", net >= 0 ? "text-profit" : "text-loss")}>
                    {net >= 0 ? "+" : ""}${net.toLocaleString()}
                  </span>
                  <button
                    className="shrink-0 rounded px-1.5 text-faint transition-colors hover:bg-panel2 hover:text-loss"
                    onClick={() => del(idx)}
                    title="delete / undo this entry"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
        </div>
      )}
    </Card>
  );
}
