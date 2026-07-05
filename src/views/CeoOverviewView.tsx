import { useStore } from "@/store/StoreProvider";
import { computeTopStats, periodTotals } from "@/lib/stats";
import { signed, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { ProgressRow, targetStatus } from "@/components/dashboard/ProgressRow";

function PnlCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="px-4 py-4">
      <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">{label}</div>
      <div className={cn("font-mono text-data-lg font-bold", value >= 0 ? "text-profit" : "text-loss")}>
        {signed(Math.round(value))}
      </div>
    </Card>
  );
}

export function CeoOverviewView() {
  const { state } = useStore();
  const s = computeTopStats(state);
  const p = periodTotals(state);
  const obj = state.objectives;

  const daily = { ...targetStatus(p.today, obj.dailyTarget), targetLabel: obj.dailyTarget ? `target ${signed(obj.dailyTarget)}` : "no target set" };
  const weekly = { ...targetStatus(p.week, obj.weeklyTarget), targetLabel: obj.weeklyTarget ? `target ${signed(obj.weeklyTarget)}` : "no target set" };
  const monthly = { ...targetStatus(p.month, obj.monthlyTarget), targetLabel: obj.monthlyTarget ? `target ${signed(obj.monthlyTarget)}` : "no target set" };
  const accountsPct = obj.maxAccounts > 0 ? (s.liveCount / obj.maxAccounts) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">CEO Office</h1>
        <p className="text-sm text-dim">Executive rollup — all-time performance, capital exposure, and progress against objectives.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PnlCard label="All-time P&L" value={p.allTime} />
        <PnlCard label="This week" value={p.week} />
        <PnlCard label="This month" value={p.month} />
        <Card className="px-4 py-4">
          <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">
            Capital deployed
          </div>
          <div className="font-mono text-data-lg font-bold text-invested">${s.deployed.toLocaleString()}</div>
          <div className="mt-1 font-mono text-data-xs text-faint">
            {state.capitalLimit > 0 ? `${s.capitalPct.toFixed(0)}% of $${state.capitalLimit.toLocaleString()} limit` : "no limit set"}
          </div>
        </Card>
        <Card className="px-4 py-4">
          <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">Capacity</div>
          <div className="font-mono text-data-lg font-bold text-ink">{s.capLabel}</div>
          <div className="mt-1 font-mono text-data-xs text-faint">{s.capPct.toFixed(0)}% of target</div>
        </Card>
        <Card className="px-4 py-4">
          <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">
            Expected Next Outcome
          </div>
          <div className="font-mono text-data-lg font-bold text-ink">+${s.fwdTotal.toFixed(0)}</div>
          <div className="mt-1 font-mono text-data-xs text-faint">forward EV</div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">
          Progress versus objectives
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <ProgressRow label="Today" actualLabel={signed(Math.round(p.today))} {...daily} />
          <ProgressRow label="This week" actualLabel={signed(Math.round(p.week))} {...weekly} />
          <ProgressRow label="This month" actualLabel={signed(Math.round(p.month))} {...monthly} />
          <ProgressRow
            label="Capital deployed"
            actualLabel={"$" + s.deployed.toLocaleString()}
            targetLabel={state.capitalLimit > 0 ? `limit $${state.capitalLimit.toLocaleString()}` : "no limit set"}
            pct={s.capitalPct}
            status={state.capitalLimit > 0 ? "capital" : "neutral"}
          />
          <ProgressRow
            label="Active accounts"
            actualLabel={String(s.liveCount)}
            targetLabel={obj.maxAccounts > 0 ? `max ${obj.maxAccounts}` : "no max set"}
            pct={accountsPct}
            status={obj.maxAccounts > 0 ? "capital" : "neutral"}
          />
        </div>
      </Card>
    </div>
  );
}
