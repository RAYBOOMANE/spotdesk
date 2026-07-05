import { useState } from "react";
import { useStore } from "@/store/StoreProvider";
import { gridDims } from "@/lib/logic";
import { managerSummaries, moneyHeldRemaining, moneyHeldStatus, type MoneyHeldStatus } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { CounterpartyType, LedgerCounterparty, LedgerItemType, MoneyHeldEntry } from "@/lib/types";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const ITEM_TYPE_LABEL: Record<LedgerItemType, string> = {
  owed_to_me: "They owe me",
  owed_by_me: "I owe them",
  they_hold_for_me: "They hold this for me",
  i_hold_for_them: "I hold this for them",
};

const STATUS_LABEL: Record<MoneyHeldStatus, string> = {
  open: "Open",
  partially_settled: "Partially settled",
  settled: "Settled",
};

function statusColor(status: MoneyHeldStatus): string {
  if (status === "settled") return "text-profit";
  if (status === "partially_settled") return "text-invested";
  return "text-dim";
}

function SettleForm({ entry, onDone }: { entry: MoneyHeldEntry; onDone: () => void }) {
  const store = useStore();
  const remaining = moneyHeldRemaining(entry);
  const [isFull, setIsFull] = useState(true);
  const [amount, setAmount] = useState(String(remaining));
  const [note, setNote] = useState("");
  const [destination, setDestination] = useState("");

  const submit = () => {
    const amt = isFull ? remaining : parseFloat(amount);
    if (isNaN(amt) || amt <= 0) return;
    store.addSettlement(entry.id, {
      date: todayIso(),
      amount: amt,
      isFull,
      note: note.trim(),
      destination: destination.trim() || undefined,
    });
    onDone();
  };

  return (
    <div className="mt-2 flex flex-col gap-2 rounded-lg border border-line bg-panel px-3 py-2.5">
      <div className="flex gap-2">
        <button
          onClick={() => {
            setIsFull(true);
            setAmount(String(remaining));
          }}
          className={cn(
            "flex-1 rounded-lg border px-2 py-1.5 text-[0.66rem] font-bold transition-colors",
            isFull ? "border-line2 bg-panel2 text-ink" : "border-line text-dim"
          )}
        >
          Full (${remaining.toLocaleString()})
        </button>
        <button
          onClick={() => setIsFull(false)}
          className={cn(
            "flex-1 rounded-lg border px-2 py-1.5 text-[0.66rem] font-bold transition-colors",
            !isFull ? "border-line2 bg-panel2 text-ink" : "border-line text-dim"
          )}
        >
          Partial
        </button>
      </div>
      {!isFull && (
        <Input inputMode="decimal" value={amount} placeholder="Amount settled" onChange={(e) => setAmount(e.target.value)} />
      )}
      <Input value={note} placeholder="Explanation / what it was for" onChange={(e) => setNote(e.target.value)} />
      <Input value={destination} placeholder="Destination / method used (optional)" onChange={(e) => setDestination(e.target.value)} />
      <div className="flex gap-2">
        <Button size="sm" onClick={submit}>
          Record settlement
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function MoneyHeldRow({ entry, label }: { entry: MoneyHeldEntry; label: string }) {
  const store = useStore();
  const [settling, setSettling] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const remaining = moneyHeldRemaining(entry);
  const status = moneyHeldStatus(entry);

  return (
    <div className="rounded-lg border border-line bg-panel2 px-3.5 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-ink">{label}</span>
            <span className="font-mono text-data-xs text-faint">{ITEM_TYPE_LABEL[entry.itemType]}</span>
          </div>
          {entry.purpose && <div className="mt-0.5 font-mono text-data-xs text-dim">{entry.purpose}</div>}
          <div className="mt-0.5 font-mono text-data-xs text-faint">
            issued {entry.dateIssued}
            {entry.expectedReturnDate ? ` · expected back ${entry.expectedReturnDate}` : ""}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="text-right">
            <div className="font-mono text-data-sm font-bold text-invested">
              ${remaining.toLocaleString()}
              {remaining !== entry.amount && (
                <span className="ml-1 font-mono text-data-xs text-faint">/ ${entry.amount.toLocaleString()}</span>
              )}
              <span className="ml-1 font-mono text-data-xs text-faint">{entry.currency}</span>
            </div>
            <div className={cn("font-mono text-data-xs font-bold", statusColor(status))}>{STATUS_LABEL[status]}</div>
          </div>
          {status !== "settled" && (
            <Button size="sm" variant="ghost" onClick={() => setSettling((s) => !s)}>
              Settle
            </Button>
          )}
          <button
            className="rounded p-1.5 text-faint transition-colors hover:bg-panel hover:text-loss"
            onClick={() => store.deleteMoneyHeld(entry.id)}
            title="delete"
          >
            ✕
          </button>
        </div>
      </div>

      {settling && <SettleForm entry={entry} onDone={() => setSettling(false)} />}

      {entry.settlements.length > 0 && (
        <div className="mt-2">
          <button
            className="font-mono text-data-xs text-dim hover:text-ink"
            onClick={() => setHistoryOpen((o) => !o)}
          >
            {historyOpen ? "▾" : "▸"} Settlement history ({entry.settlements.length})
          </button>
          {historyOpen && (
            <div className="mt-1.5 flex flex-col gap-1">
              {entry.settlements.map((s) => (
                <div key={s.id} className="font-mono text-data-xs text-faint">
                  {s.date} · ${s.amount.toLocaleString()} · {s.isFull ? "full" : "partial"}
                  {s.destination ? ` · ${s.destination}` : ""}
                  {s.note ? ` · ${s.note}` : ""}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MoneyHeldView() {
  const store = useStore();
  const { state } = store;
  const { nClusters } = gridDims(state);
  const managers = managerSummaries(state);

  const [itemType, setItemType] = useState<LedgerItemType>("owed_to_me");
  const [cpType, setCpType] = useState<CounterpartyType>("client");
  const [cpKey, setCpKey] = useState<string>("1");
  const [customName, setCustomName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [purpose, setPurpose] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");

  const counterpartyLabel = (cp: LedgerCounterparty): string => {
    if (cp.type === "client") {
      const c = parseInt(cp.key ?? "0", 10);
      return state.names?.[c] ?? "C" + c;
    }
    if (cp.type === "manager") {
      const m = managers.find((m) => m.hex === cp.key);
      return m ? m.name : "Manager";
    }
    return cp.customName || "Someone";
  };

  const submit = () => {
    const amt = parseFloat(amount);
    if (!amount.trim() || isNaN(amt) || amt <= 0) return;
    const counterparty: LedgerCounterparty =
      cpType === "custom" ? { type: "custom", customName: customName.trim() || "Someone" } : { type: cpType, key: cpKey };
    store.addMoneyHeld({
      itemType,
      counterparty,
      amount: amt,
      currency: currency.trim() || "USD",
      purpose: purpose.trim(),
      dateIssued: todayIso(),
      expectedReturnDate: expectedReturnDate.trim() || undefined,
      settlements: [],
    });
    setAmount("");
    setPurpose("");
    setExpectedReturnDate("");
  };

  const active = state.moneyHeld.filter((e) => moneyHeldStatus(e) !== "settled");
  const settled = state.moneyHeld.filter((e) => moneyHeldStatus(e) === "settled");

  const itemTypes: LedgerItemType[] = ["owed_to_me", "owed_by_me", "they_hold_for_me", "i_hold_for_them"];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Money Held</h1>
        <p className="text-sm text-dim">
          A ledger for debts AND temporary liquidity routing — when a friend, manager, or client holds money for you
          (or you for them) because your own account is limited, not just simple debts.
        </p>
      </div>

      <Card className="p-5">
        <div className="mb-4 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">New entry</div>

        <Label>Type</Label>
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {itemTypes.map((t) => (
            <button
              key={t}
              onClick={() => setItemType(t)}
              className={cn(
                "rounded-lg border px-2 py-2 text-[0.66rem] font-bold transition-colors",
                itemType === t ? "border-line2 bg-panel2 text-ink" : "border-line text-dim"
              )}
            >
              {ITEM_TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label>Counterparty type</Label>
            <div className="flex gap-2">
              {(["client", "manager", "custom"] as CounterpartyType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setCpType(t);
                    if (t === "manager") setCpKey(managers[0]?.hex ?? "");
                    if (t === "client") setCpKey("1");
                  }}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-2 text-[0.68rem] font-bold capitalize transition-colors",
                    cpType === t ? "border-line2 bg-panel2 text-ink" : "border-line text-dim"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>{cpType === "custom" ? "Name" : cpType === "client" ? "Client" : "Manager"}</Label>
            {cpType === "custom" ? (
              <Input value={customName} placeholder="Person's name" onChange={(e) => setCustomName(e.target.value)} />
            ) : (
              <select
                value={cpKey}
                onChange={(e) => setCpKey(e.target.value)}
                className="w-full rounded-xl border border-line bg-panel2 px-3 py-2.5 font-mono text-[0.8rem] text-ink focus:border-line2 focus:outline-none"
              >
                {cpType === "client"
                  ? Array.from({ length: nClusters }, (_, i) => i + 1).map((c) => (
                      <option key={c} value={c}>
                        {state.names?.[c] ?? "C" + c}
                      </option>
                    ))
                  : managers.map((m) => (
                      <option key={m.hex} value={m.hex}>
                        {m.name}
                      </option>
                    ))}
              </select>
            )}
          </div>
          <div>
            <Label>Amount</Label>
            <Input inputMode="decimal" value={amount} placeholder="e.g. 500" onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Currency</Label>
            <Input value={currency} placeholder="USD" onChange={(e) => setCurrency(e.target.value)} />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <Label>Purpose / note</Label>
            <Input value={purpose} placeholder="What's this for?" onChange={(e) => setPurpose(e.target.value)} />
          </div>
          <div>
            <Label>Expected return date (optional)</Label>
            <Input type="date" value={expectedReturnDate} onChange={(e) => setExpectedReturnDate(e.target.value)} />
          </div>
        </div>

        <Button className="mt-4" onClick={submit}>
          Add entry
        </Button>
      </Card>

      <Card className="p-5">
        <div className="mb-3 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">
          Active ({active.length})
        </div>
        <div className="flex flex-col gap-2">
          {active.length === 0 ? (
            <p className="font-mono text-data-xs text-faint">Nothing outstanding.</p>
          ) : (
            active.map((e) => <MoneyHeldRow key={e.id} entry={e} label={counterpartyLabel(e.counterparty)} />)
          )}
        </div>
      </Card>

      {settled.length > 0 && (
        <Card className="p-5">
          <div className="mb-3 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">
            Settled ({settled.length})
          </div>
          <div className="flex flex-col gap-2">
            {settled.map((e) => (
              <MoneyHeldRow key={e.id} entry={e} label={counterpartyLabel(e.counterparty)} />
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
