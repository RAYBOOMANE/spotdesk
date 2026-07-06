import { useState } from "react";
import { X } from "lucide-react";
import { useStore } from "@/store/StoreProvider";
import { useDialogs } from "@/components/ConfirmProvider";
import { Card } from "@/components/ui/card";
import { clusterOf, colorOf } from "@/lib/logic";

export function NowTradingCard({
  id,
  onOpen,
  onRemove,
  hasCapitalLimit,
  investedOpacity,
  copySelected,
  onToggleCopySelect,
}: {
  id: string;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
  hasCapitalLimit: boolean;
  investedOpacity: number;
  copySelected: boolean;
  onToggleCopySelect: (id: string) => void;
}) {
  const store = useStore();
  const dialogs = useDialogs();
  const { state } = store;
  const c = clusterOf(id);
  const a = id.split("-")[1];
  const sp = state.spots[id] ?? { day: 0, cost: 0, extra: 0 };
  const occupied = sp.day >= 1;
  const name = state.names?.[c] ?? "C" + c;
  const clientColor = colorOf(state, c);
  // True stored invested capital, no benchmark fallback: setDaySingle always
  // resolves a blank cost to the benchmark BEFORE storing it, so cost+extra
  // is only ever genuinely 0 right after a payout (which really does zero it
  // out) — showing the benchmark there instead of $0 would be misleading.
  const tied = occupied ? (sp.cost || 0) + (sp.extra || 0) : 0;
  const [amount, setAmount] = useState("");

  // Blew/Payout pass the account's REAL current cost/extra (never null) so
  // the net profit/loss is deducted against what is actually invested — the
  // exact $tied figure shown above. Passing null here would silently fall
  // back to the flat ladder benchmark instead of the true invested amount,
  // corrupting the net number whenever extra investment had been added.
  const quickBlow = () => store.logOutcomeSingle(id, sp.day, "blew", sp.cost, sp.extra, null);

  // Payout uses the typed amount as the gross received (blank = existing
  // benchmark fallback for the gross only — cost/extra are always the real,
  // already-known values, never blank).
  const submitPayout = () => {
    const amt = amount.trim() === "" ? null : parseFloat(amount);
    store.logOutcomeSingle(id, sp.day, "payout", sp.cost, sp.extra, amt);
    setAmount("");
  };

  // Adding investment is NOT an outcome — it deposits more capital into the
  // same position via the existing setDaySingle (same as "Set Day" in the
  // full modal), so the account stays open and in this working set. Passing
  // the real sp.cost (instead of null) preserves any custom cost already set
  // rather than silently resetting it to the benchmark.
  const submitInvest = () => {
    const add = parseFloat(amount);
    if (!amount.trim() || isNaN(add) || add <= 0) {
      void dialogs.alert("Enter an amount to add to this account first.");
      return;
    }
    store.setDaySingle(id, sp.day, sp.cost, (sp.extra || 0) + add);
    setAmount("");
  };

  return (
    <Card className="p-3.5">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2">
          <input
            type="checkbox"
            checked={copySelected}
            disabled={!occupied}
            onChange={() => onToggleCopySelect(id)}
            className="mt-1 h-3.5 w-3.5 shrink-0 cursor-pointer accent-ink disabled:cursor-not-allowed"
            title="select for copy trade"
          />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                className="h-[8px] w-[8px] shrink-0 rounded-[2px]"
                style={{ background: clientColor }}
                title="client color"
              />
              <div className="truncate text-[0.7rem] font-bold text-ink">{name}</div>
            </div>
            <div className="font-mono text-[0.6rem] text-dim">
              C{c}·A{a}
            </div>
          </div>
        </div>
        <button
          onClick={() => onRemove(id)}
          className="shrink-0 rounded p-1 text-faint transition-colors hover:bg-panel2 hover:text-ink"
          title="Remove from Now Trading"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {occupied ? (
        <div className="mb-2.5 flex items-center gap-1.5">
          <span
            className="h-[7px] w-[7px] shrink-0 rounded-full bg-invested"
            style={{ opacity: hasCapitalLimit ? investedOpacity : 0.7 }}
          />
          <span className="font-mono text-[0.82rem] font-semibold text-ink">D{sp.day}</span>
          <span
            className="font-mono text-[0.6rem] text-invested"
            style={{ opacity: hasCapitalLimit ? investedOpacity : 0.85 }}
          >
            ${tied.toLocaleString()} invested
          </span>
        </div>
      ) : (
        <div className="mb-2.5 font-mono text-[0.6rem] text-faint">free — not yet trading</div>
      )}

      <button
        disabled={!occupied}
        onClick={quickBlow}
        className="mb-2 w-full rounded-lg border border-loss/40 px-2 py-2 text-[0.64rem] font-bold text-loss transition-colors hover:bg-loss/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
      >
        Blew
      </button>

      <input
        disabled={!occupied}
        inputMode="decimal"
        value={amount}
        placeholder="$ amount"
        onChange={(e) => setAmount(e.target.value)}
        className="mb-2 w-full rounded-lg border border-line bg-panel2 px-2 py-2 text-center font-mono text-[0.64rem] text-ink placeholder:text-faint focus:border-line2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      />
      <div className="grid grid-cols-2 gap-2">
        <button
          disabled={!occupied}
          onClick={submitPayout}
          className="rounded-lg border border-profit/40 px-2 py-2 text-[0.64rem] font-bold text-profit transition-colors hover:bg-profit/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          Payout
        </button>
        <button
          disabled={!occupied}
          onClick={submitInvest}
          className="rounded-lg border border-invested/40 px-2 py-2 text-[0.64rem] font-bold text-invested transition-colors hover:bg-invested/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
        >
          + Invest
        </button>
      </div>

      <button
        onClick={() => onOpen(id)}
        className="mt-2 w-full rounded-lg border border-line bg-panel2 px-2 py-2 text-[0.62rem] font-medium text-dim transition-colors hover:border-line2 hover:text-ink"
      >
        Open full log
      </button>
    </Card>
  );
}
