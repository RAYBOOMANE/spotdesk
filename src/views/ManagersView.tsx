import { useState } from "react";
import { useStore } from "@/store/StoreProvider";
import { useDialogs } from "@/components/ConfirmProvider";
import { managerSummaries, type ManagerSummary } from "@/lib/stats";
import { signed, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

function ManagerCard({ m }: { m: ManagerSummary }) {
  const store = useStore();
  const dialogs = useDialogs();
  const [splitStr, setSplitStr] = useState(String(m.splitPct));

  const rename = async () => {
    const name = await dialogs.prompt("Manager name", m.name, m.name);
    if (name === null) return;
    store.setManagerName(m.hex, name);
  };

  const commitSplit = () => store.setManagerSplit(m.hex, parseFloat(splitStr) || 0);

  return (
    <Card className="p-4" style={{ borderTop: `2px solid ${m.hex}` }}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <button className="flex min-w-0 items-center gap-2 text-left" onClick={rename} title="click to rename">
          <span className="h-[11px] w-[11px] shrink-0 rounded-[3px]" style={{ background: m.hex }} />
          <span className="truncate text-[0.9rem] font-bold text-ink hover:text-dim">{m.name}</span>
        </button>
        <span className="shrink-0 font-mono text-data-xs text-faint">{m.clusterLabels}</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <div className="mb-0.5 font-mono text-micro font-medium uppercase tracking-[0.1em] text-dim">
            Capital invested
          </div>
          <div className="font-mono text-data-sm font-bold text-invested">${m.capitalInvested.toLocaleString()}</div>
        </div>
        <div>
          <div className="mb-0.5 font-mono text-micro font-medium uppercase tracking-[0.1em] text-dim">
            All-time P&amp;L
          </div>
          <div className={cn("font-mono text-data-sm font-bold", m.allTimePL >= 0 ? "text-profit" : "text-loss")}>
            {signed(Math.round(m.allTimePL))}
          </div>
        </div>
        <div>
          <div className="mb-0.5 font-mono text-micro font-medium uppercase tracking-[0.1em] text-dim">
            Expected payout
          </div>
          <div className="font-mono text-data-sm font-bold text-ink">${m.expectedPayout.toFixed(0)}</div>
        </div>
        <div>
          <div className="mb-0.5 font-mono text-micro font-medium uppercase tracking-[0.1em] text-dim">
            Week-to-date
          </div>
          <div className={cn("font-mono text-data-sm font-bold", m.weekNet >= 0 ? "text-profit" : "text-loss")}>
            {signed(Math.round(m.weekNet))}
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-line bg-panel2 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-data-xs text-dim">Split %</span>
          <input
            inputMode="decimal"
            value={splitStr}
            onChange={(e) => setSplitStr(e.target.value)}
            onBlur={commitSplit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitSplit();
                e.currentTarget.blur();
              }
            }}
            className="w-14 rounded border border-line bg-panel px-1.5 py-1 text-center font-mono text-data-xs text-ink focus:border-line2 focus:outline-none"
          />
        </div>
        <div className="text-right">
          <div className="font-mono text-micro font-medium uppercase tracking-[0.1em] text-dim">Weekly payout owed</div>
          <div className={cn("font-mono text-data-sm font-bold", m.weeklyOwed >= 0 ? "text-profit" : "text-loss")}>
            {signed(Math.round(m.weeklyOwed))}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ManagersView() {
  const { state } = useStore();
  const summaries = managerSummaries(state);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Managers</h1>
        <p className="text-sm text-dim">
          Each color group is a manager. Set their split % to compute what's owed from this week's net profit.
        </p>
      </div>

      {summaries.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-line bg-panel py-24 text-center">
          <p className="text-sm text-dim">No clients yet — managers appear once clients are grouped by color.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {summaries.map((m) => (
            <ManagerCard key={m.hex} m={m} />
          ))}
        </div>
      )}
    </div>
  );
}
