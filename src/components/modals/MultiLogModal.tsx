import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DayRow } from "@/components/DayRow";
import { LADDER } from "@/lib/ladder";
import { fwdEV } from "@/lib/logic";
import { useStore } from "@/store/StoreProvider";
import { useDialogs } from "@/components/ConfirmProvider";

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
  const { state } = store;
  const dialogs = useDialogs();
  const [day, setDay] = useState(1);
  const [cost, setCost] = useState("");
  const [extra, setExtra] = useState("");
  const [grossTotal, setGrossTotal] = useState("");

  const firstSp = ids.length ? state.spots[ids[0]] : undefined;
  const areEmpty = !(firstSp && firstSp.day >= 1);
  const n = ids.length;

  useEffect(() => {
    if (!open) return;
    setDay(areEmpty ? 1 : firstSp!.day);
    setCost("");
    setExtra("");
    setGrossTotal("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const act = (fn: () => void) => {
    fn();
    onDone();
    onClose();
  };

  const L = LADDER[day];

  // ---- Opening several EMPTY slots together: a genuine uniform deploy ----
  // (no existing per-account state to preserve here, so one cost/extra
  // applied to all of them is correct — same as the reference behavior).
  const openTogether = () =>
    act(() => store.multiSetDay(ids, day, parseMaybe(cost), parseMaybe(extra)));

  // ---- Closing out several ALREADY-OCCUPIED accounts together (copy trade)
  // Matches Now Trading's copy-trade modal exactly: type the TOTAL across
  // all {n} accounts, split evenly, then applied against EACH account's OWN
  // real invested capital (copyTradeOutcome), never a flat benchmark.
  const perAccount = () => {
    const total = parseMaybe(grossTotal);
    return total == null ? null : total / n;
  };
  const closeTogether = (type: "blew" | "payout") =>
    act(() => store.copyTradeOutcome(ids, type, perAccount()));

  const investAll = () => {
    const total = parseMaybe(grossTotal);
    if (!grossTotal.trim() || total == null || total <= 0) {
      void dialogs.alert("Enter an amount to add to these accounts first.");
      return;
    }
    const perAccountAmt = total / n;
    ids.forEach((id) => {
      const sp = state.spots[id];
      if (!sp) return;
      store.setDaySingle(id, sp.day, sp.cost, (sp.extra || 0) + perAccountAmt);
    });
    act(() => {});
  };

  const preview = perAccount();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>{areEmpty ? "Open together" : "Copy trade"}</DialogTitle>
        <DialogDescription>
          Applies to {n} {areEmpty ? "empty spots to open" : "occupied accounts"}: {ids.join(", ")}
        </DialogDescription>

        {areEmpty ? (
          <>
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

            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="set" onClick={openTogether}>
                Set day (all)
              </Button>
              <Button variant="ghost" onClick={() => act(() => store.multiFree(ids))}>
                Free all
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 rounded-lg bg-panel2 px-2.5 py-2 font-mono text-[0.6rem] leading-relaxed text-faint">
              D{day} · net is calculated against each account's OWN total invested (its own cost + extra), not a flat
              benchmark.
            </div>

            <Label>Amount (total across {n} accounts)</Label>
            <Input
              inputMode="decimal"
              value={grossTotal}
              placeholder="e.g. 400"
              onChange={(e) => setGrossTotal(e.target.value)}
            />
            {preview != null && (
              <div className="mt-2 font-mono text-data-xs text-faint">
                = <span className="text-ink">${preview.toLocaleString()}</span> per account
              </div>
            )}

            <Button className="mt-4 w-full" onClick={() => closeTogether("blew")}>
              Blew all
            </Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button variant="payout" onClick={() => closeTogether("payout")}>
                Payout all
              </Button>
              <Button
                variant="ghost"
                className="border-invested/40 text-invested hover:border-invested/40 hover:bg-invested/10 hover:text-invested"
                onClick={investAll}
              >
                + Invest all
              </Button>
            </div>
            <Button className="mt-2 w-full" variant="ghost" onClick={() => act(() => store.multiFree(ids))}>
              Free all
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
