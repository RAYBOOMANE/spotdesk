import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DayRow } from "@/components/DayRow";
import { LADDER } from "@/lib/ladder";
import { fwdEV } from "@/lib/logic";
import { useStore } from "@/store/StoreProvider";
import type { OutcomeType } from "@/lib/types";

function parseMaybe(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

export function MultiLogModal({
  open,
  ids,
  onClose,
  onDone,
}: {
  open: boolean;
  ids: string[];
  onClose: () => void;
  onDone: () => void; // clears selection
}) {
  const store = useStore();
  const [day, setDay] = useState(1);
  const [cost, setCost] = useState("");
  const [extra, setExtra] = useState("");
  const [amount, setAmount] = useState("");

  const firstSp = ids.length ? store.state.spots[ids[0]] : undefined;
  const areEmpty = !(firstSp && firstSp.day >= 1);

  useEffect(() => {
    if (!open) return;
    setDay(areEmpty ? 1 : firstSp!.day);
    setCost("");
    setExtra("");
    setAmount("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const L = LADDER[day];
  const n = ids.length;
  const preview = useMemo(() => {
    const typed = parseMaybe(cost);
    const ex = parseMaybe(extra) ?? 0;
    const invested = (typed == null ? L.inv : typed) + ex;
    const gross = parseMaybe(amount);
    if (gross == null)
      return <>On blow: net per acct = gross − ${invested.toLocaleString()}. Total across {n} accts.</>;
    const netEach = gross - invested;
    const netAll = netEach * n;
    const col = (v: number) => ({ color: v >= 0 ? "var(--profit)" : "var(--loss)" });
    return (
      <>
        Per acct: ${gross.toLocaleString()} − ${invested.toLocaleString()} ={" "}
        <b style={col(netEach)}>
          {netEach >= 0 ? "+" : ""}${(Math.round(netEach * 100) / 100).toLocaleString()}
        </b>{" "}
        · ×{n} ={" "}
        <b style={col(netAll)}>
          {netAll >= 0 ? "+" : ""}${(Math.round(netAll * 100) / 100).toLocaleString()} total
        </b>
      </>
    );
  }, [cost, extra, amount, day, n, L.inv]);

  const act = (fn: () => void) => {
    fn();
    onDone();
    onClose();
  };
  const outcome = (type: OutcomeType) =>
    act(() => store.multiOutcome(ids, day, type, parseMaybe(cost), parseMaybe(extra), parseMaybe(amount)));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Multi-log · copy trade</DialogTitle>
        <DialogDescription>
          Applies to {n} {areEmpty ? "empty spots to open" : "occupied accounts"}: {ids.join(", ")}
        </DialogDescription>

        <Label>Day on ladder</Label>
        <DayRow value={day} onChange={setDay} />

        <div className="mb-4 rounded-lg bg-panel2 px-2.5 py-2 font-mono text-[0.6rem] leading-relaxed text-faint">
          Day {day}: benchmark cost <b className="text-ink">${L.inv}</b> · forward EV{" "}
          <b className="text-ink">~${fwdEV(day).toFixed(0)}</b> · ×{n} accounts
        </div>

        <div className="mb-1 grid grid-cols-2 gap-2.5">
          <div>
            <Label>Investment PER account</Label>
            <Input inputMode="decimal" value={cost} placeholder={String(L.inv)} onChange={(e) => setCost(e.target.value)} />
          </div>
          <div>
            <Label>Extra PER account</Label>
            <Input inputMode="decimal" value={extra} placeholder="0" onChange={(e) => setExtra(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <Label>Gross received PER account</Label>
          <Input
            inputMode="decimal"
            value={amount}
            placeholder={String(L.prof)}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="my-4 rounded-lg bg-panel2 px-2.5 py-2 font-mono text-[0.6rem] leading-relaxed text-faint">
          {preview}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => outcome("blew")}>Blew all +$</Button>
          <Button variant="payout" onClick={() => outcome("payout")}>
            Payout all +$
          </Button>
          <Button
            variant="set"
            onClick={() => act(() => store.multiSetDay(ids, day, parseMaybe(cost), parseMaybe(extra)))}
          >
            Set day (all)
          </Button>
          <Button variant="ghost" onClick={() => act(() => store.multiFree(ids))}>
            Free all
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
