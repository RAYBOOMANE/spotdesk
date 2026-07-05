import { useMemo, useState } from "react";
import { useStore } from "@/store/StoreProvider";
import { gridDims } from "@/lib/logic";
import { ledgerRows, ledgerAuthoritativeTotals, managerSummaries, type LedgerRow } from "@/lib/stats";
import { signed, cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, Th, Td } from "@/components/ui/table";
import { EditSourceEntryModal } from "@/components/modals/EditSourceEntryModal";

export function AccountingLedgerView({ onOpenDay }: { onOpenDay: (idx: number) => void }) {
  const store = useStore();
  const { state } = store;
  const { nClusters } = gridDims(state);
  const managers = managerSummaries(state);
  const allRows = useMemo(() => ledgerRows(state), [state]);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [colorFilter, setColorFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "blew" | "payout">("all");
  const [editEntryIdx, setEditEntryIdx] = useState<number | null>(null);

  const rows = allRows.filter((r) => {
    if (dateFrom && r.isoDate && r.isoDate < dateFrom) return false;
    if (dateTo && r.isoDate && r.isoDate > dateTo) return false;
    if (clientFilter !== "all" && String(r.cluster) !== clientFilter) return false;
    if (colorFilter !== "all" && r.color !== colorFilter) return false;
    if (typeFilter !== "all" && r.type !== typeFilter) return false;
    return true;
  });

  // A day-level total (or override) carries no per-client attribution, so
  // Net P&L / Total payouts can only be "authoritative" (immune to a manual
  // editHistoryDay correction) when NOT narrowed to one client/manager. Once
  // you filter by client or manager, there's no alternative but to fall back
  // to summing the raw filtered entries -- same as Total invested/losses
  // always do (see note below the totals).
  const noEntityFilter = clientFilter === "all" && colorFilter === "all";
  const authoritative = useMemo(
    () => ledgerAuthoritativeTotals(state, { dateFrom, dateTo, type: typeFilter }),
    [state, dateFrom, dateTo, typeFilter]
  );

  const totalInvested = rows.reduce((s, r) => s + r.invested, 0);
  const totalLosses = rows.filter((r) => r.net < 0).reduce((s, r) => s + Math.abs(r.net), 0);
  const totalPayouts = noEntityFilter
    ? authoritative.grossPayouts
    : rows.filter((r) => r.type === "payout").reduce((s, r) => s + r.amount, 0);
  const netPnl = noEntityFilter ? authoritative.netPnl : rows.reduce((s, r) => s + r.net, 0);

  const selectClass =
    "w-full rounded-xl border border-line bg-panel2 px-3 py-2.5 font-mono text-[0.8rem] text-ink focus:border-line2 focus:outline-none";

  // Read-only ledger: this never edits anything itself. Historical rows open
  // the SAME DayDetailModal used by the History tab (edits happen there, not
  // here). Today rows open a dedicated Edit Source Entry modal that only
  // corrects the one entry it was opened for -- never the shared LogModal,
  // which would let you log a whole new outcome or touch the live account.
  const openSource = (r: LedgerRow) => {
    if (r.historyIndex != null) onOpenDay(r.historyIndex);
    else if (r.todayLogIndex != null) setEditEntryIdx(r.todayLogIndex);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Ledger</h1>
        <p className="text-sm text-dim">
          Every logged entry, today and archived — read-only, built from existing trading data. "Open source" opens a
          dedicated edit sheet for today's rows (correct or delete just that entry, without logging a new outcome or
          touching the live account) or the archived day it came from for history rows. Note: only outcomes
          (blows/payouts) are logged as ledger events; deploying capital (Set Day) isn't recorded as its own entry in
          the current data model.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="px-4 py-4">
          <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">
            Total invested
          </div>
          <div className="font-mono text-data-lg font-bold text-invested">${totalInvested.toLocaleString()}</div>
        </Card>
        <Card className="px-4 py-4">
          <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">
            Total payouts / profits
          </div>
          <div className="font-mono text-data-lg font-bold text-profit">${totalPayouts.toLocaleString()}</div>
        </Card>
        <Card className="px-4 py-4">
          <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">
            Total losses
          </div>
          <div className="font-mono text-data-lg font-bold text-loss">${totalLosses.toLocaleString()}</div>
        </Card>
        <Card className="px-4 py-4">
          <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">Net P&amp;L</div>
          <div className={cn("font-mono text-data-lg font-bold", netPnl >= 0 ? "text-profit" : "text-loss")}>
            {signed(Math.round(netPnl))}
          </div>
        </Card>
      </div>

      <div className="rounded-lg border border-line bg-panel2 px-3 py-2 font-mono text-data-xs text-faint">
        Net P&amp;L and Total payouts/profits use each day's authoritative totals (so a manually corrected archived
        day is always reflected here) — unless a client or manager filter is active, in which case they're summed
        from individual entries instead, since a day-level total has no per-client breakdown.{" "}
        {!noEntityFilter && (
          <span className="text-invested">Client/manager filter active — totals below use individual entries.</span>
        )}{" "}
        Total invested and Total losses always use individual entries (no day-level equivalent exists for either).
      </div>

      <Card className="p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label className="mb-1 block font-mono text-micro font-medium uppercase tracking-[0.1em] text-dim">
              From
            </label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={selectClass} />
          </div>
          <div>
            <label className="mb-1 block font-mono text-micro font-medium uppercase tracking-[0.1em] text-dim">
              To
            </label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={selectClass} />
          </div>
          <div>
            <label className="mb-1 block font-mono text-micro font-medium uppercase tracking-[0.1em] text-dim">
              Client
            </label>
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className={selectClass}>
              <option value="all">All clients</option>
              {Array.from({ length: nClusters }, (_, i) => i + 1).map((c) => (
                <option key={c} value={c}>
                  {state.names?.[c] ?? "C" + c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block font-mono text-micro font-medium uppercase tracking-[0.1em] text-dim">
              Manager
            </label>
            <select value={colorFilter} onChange={(e) => setColorFilter(e.target.value)} className={selectClass}>
              <option value="all">All managers</option>
              {managers.map((m) => (
                <option key={m.hex} value={m.hex}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          {(["all", "blew", "payout"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-[0.68rem] font-bold capitalize transition-colors",
                typeFilter === t ? "border-line2 bg-panel2 text-ink" : "border-line text-dim"
              )}
            >
              {t === "all" ? "All types" : t === "blew" ? "Blew" : "Payout"}
            </button>
          ))}
        </div>
      </Card>

      <Card className="p-0">
        <Table>
          <THead>
            <tr>
              <Th>Date</Th>
              <Th>Time</Th>
              <Th>Client</Th>
              <Th>Type</Th>
              <Th>Amount</Th>
              <Th>Invested</Th>
              <Th>Net P&amp;L</Th>
              <Th>Source</Th>
              <Th></Th>
            </tr>
          </THead>
          <TBody>
            {rows.length === 0 ? (
              <tr>
                <Td colSpan={9} className="text-center text-faint">
                  No entries match these filters.
                </Td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.key}>
                  <Td className="text-data-sm">{r.dateLabel}</Td>
                  <Td className="text-data-sm text-dim">{r.time}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="h-[8px] w-[8px] shrink-0 rounded-[2px]" style={{ background: r.color }} />
                      <span className="font-semibold text-ink">{r.clientName}</span>
                      <span className="font-mono text-data-xs text-faint">{r.id}</span>
                    </div>
                  </Td>
                  <Td className="text-data-sm capitalize">{r.type === "blew" ? "Blew" : "Payout"}</Td>
                  <Td className="text-data-sm">${r.amount.toLocaleString()}</Td>
                  <Td className="text-data-sm text-invested">${r.invested.toLocaleString()}</Td>
                  <Td className={cn("text-data-sm font-bold", r.net >= 0 ? "text-profit" : "text-loss")}>
                    {signed(Math.round(r.net))}
                  </Td>
                  <Td className="text-data-xs text-faint">{r.sourceLabel}</Td>
                  <Td>
                    <button
                      onClick={() => openSource(r)}
                      className="rounded-lg border border-line bg-panel2 px-2.5 py-1 text-[0.62rem] font-bold text-dim transition-colors hover:border-line2 hover:text-ink"
                    >
                      Open source ↗
                    </button>
                  </Td>
                </tr>
              ))
            )}
          </TBody>
        </Table>
      </Card>

      <EditSourceEntryModal todayLogIndex={editEntryIdx} onClose={() => setEditEntryIdx(null)} />
    </div>
  );
}
