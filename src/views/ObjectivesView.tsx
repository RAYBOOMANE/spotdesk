import { useState } from "react";
import { useStore } from "@/store/StoreProvider";
import { computeTopStats, periodTotals } from "@/lib/stats";
import { signed } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressRow, targetStatus } from "@/components/dashboard/ProgressRow";

export function ObjectivesView() {
  const store = useStore();
  const { state } = store;
  const s = computeTopStats(state);
  const p = periodTotals(state);
  const obj = state.objectives;

  // Local string buffers so typing isn't fought by re-renders; committed to
  // the real store.setObjectives / store.setCapitalLimit on blur. Remounting
  // this view (e.g. navigating away and back) re-reads the persisted values.
  const [dailyStr, setDailyStr] = useState(obj.dailyTarget ? String(obj.dailyTarget) : "");
  const [weeklyStr, setWeeklyStr] = useState(obj.weeklyTarget ? String(obj.weeklyTarget) : "");
  const [monthlyStr, setMonthlyStr] = useState(obj.monthlyTarget ? String(obj.monthlyTarget) : "");
  const [maxAccountsStr, setMaxAccountsStr] = useState(obj.maxAccounts ? String(obj.maxAccounts) : "");
  const [notes, setNotes] = useState(obj.notes || "");
  const [capitalLimitStr, setCapitalLimitStr] = useState(state.capitalLimit ? String(state.capitalLimit) : "");

  const commitNumber = (field: "dailyTarget" | "weeklyTarget" | "monthlyTarget" | "maxAccounts", v: string) =>
    store.setObjectives({ [field]: Math.max(0, parseFloat(v) || 0) });
  const commitNotes = (v: string) => store.setObjectives({ notes: v });
  const commitCapitalLimit = () => store.setCapitalLimit(parseFloat(capitalLimitStr) || 0);

  const daily = { ...targetStatus(p.today, obj.dailyTarget), targetLabel: obj.dailyTarget ? `target ${signed(obj.dailyTarget)}` : "no target set" };
  const weekly = { ...targetStatus(p.week, obj.weeklyTarget), targetLabel: obj.weeklyTarget ? `target ${signed(obj.weeklyTarget)}` : "no target set" };
  const monthly = { ...targetStatus(p.month, obj.monthlyTarget), targetLabel: obj.monthlyTarget ? `target ${signed(obj.monthlyTarget)}` : "no target set" };

  const accountsPct = obj.maxAccounts > 0 ? (s.liveCount / obj.maxAccounts) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Objectives</h1>
        <p className="text-sm text-dim">
          Set daily, weekly, and monthly targets — Trading Floor shows progress against the daily one at the top.
        </p>
      </div>

      <Card className="p-5">
        <div className="mb-4 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">Targets</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label>Daily P&amp;L target ($)</Label>
            <Input
              inputMode="decimal"
              value={dailyStr}
              placeholder="e.g. 200"
              onChange={(e) => setDailyStr(e.target.value)}
              onBlur={() => commitNumber("dailyTarget", dailyStr)}
            />
          </div>
          <div>
            <Label>Weekly P&amp;L target ($)</Label>
            <Input
              inputMode="decimal"
              value={weeklyStr}
              placeholder="e.g. 1000"
              onChange={(e) => setWeeklyStr(e.target.value)}
              onBlur={() => commitNumber("weeklyTarget", weeklyStr)}
            />
          </div>
          <div>
            <Label>Monthly P&amp;L target ($)</Label>
            <Input
              inputMode="decimal"
              value={monthlyStr}
              placeholder="e.g. 4000"
              onChange={(e) => setMonthlyStr(e.target.value)}
              onBlur={() => commitNumber("monthlyTarget", monthlyStr)}
            />
          </div>
          <div>
            <Label>Max capital allocation ($)</Label>
            <Input
              inputMode="decimal"
              value={capitalLimitStr}
              placeholder="No limit set"
              onChange={(e) => setCapitalLimitStr(e.target.value)}
              onBlur={commitCapitalLimit}
            />
          </div>
          <div>
            <Label>Max active accounts</Label>
            <Input
              inputMode="numeric"
              value={maxAccountsStr}
              placeholder="e.g. 40"
              onChange={(e) => setMaxAccountsStr(e.target.value)}
              onBlur={() => commitNumber("maxAccounts", maxAccountsStr)}
            />
          </div>
        </div>

        <div className="mt-4">
          <Label>Notes (optional)</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => commitNotes(notes)}
            placeholder="Anything worth remembering about this period's goals…"
            rows={3}
            className="w-full rounded-xl border border-line bg-panel2 px-3 py-2.5 font-mono text-[0.8rem] text-ink placeholder:text-faint focus:border-line2 focus:outline-none"
          />
        </div>

        <div className="mt-4 rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-data-xs text-faint">
          Saved automatically — everything on this page persists like the rest of SPOTDESK (same SQLite autosave).
        </div>
      </Card>

      <Card className="p-5">
        <div className="mb-4 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">Progress</div>
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
