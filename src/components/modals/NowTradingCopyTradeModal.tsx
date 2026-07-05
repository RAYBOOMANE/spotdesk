import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/StoreProvider";
import { useDialogs } from "@/components/ConfirmProvider";

function parseMaybe(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// A dedicated Now Trading copy-trade modal. You type the TOTAL gross across
// all accounts, not a per-account amount — e.g. blowing 2 accounts at $200
// each, you enter 400 once and it's split evenly, then applied against each
// account's OWN real invested capital via copyTradeOutcome (never a flat
// benchmark — copy-traded accounts can carry different accumulated extra).
export function NowTradingCopyTradeModal({
  open,
  ids,
  day,
  onClose,
}: {
  open: boolean;
  ids: string[];
  day: number;
  onClose: () => void;
}) {
  const store = useStore();
  const { state } = store;
  const dialogs = useDialogs();
  const [grossTotal, setGrossTotal] = useState("");
  const n = ids.length;

  const perAccount = () => {
    const total = parseMaybe(grossTotal);
    return total == null ? null : total / n;
  };

  const act = (type: "blew" | "payout") => {
    // Each account's own real cost+extra, never a flat benchmark -- copy-
    // traded accounts can carry different accumulated extra investment.
    store.copyTradeOutcome(ids, type, perAccount());
    setGrossTotal("");
    onClose();
  };

  // +Invest is NOT an outcome (same as the individual card's quick action):
  // it deposits more capital into each account's OWN existing position via
  // setDaySingle, per account — never multiSetDay, which would blunt-reset
  // every account in the group to the SAME cost/extra and discard whatever
  // each one individually already had. The typed TOTAL is split evenly, then
  // ADDED on top of each account's own current extra, preserving its own cost.
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
      store.setDaySingle(id, day, sp.cost, (sp.extra || 0) + perAccountAmt);
    });
    setGrossTotal("");
    onClose();
  };

  const preview = perAccount();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Copy trade · D{day}</DialogTitle>
        <DialogDescription>
          Applies to {n} accounts: {ids.join(", ")}. Enter the TOTAL amount across all {n} — it's split evenly per
          account.
        </DialogDescription>

        <Label>Amount (total across {n} accounts)</Label>
        <Input inputMode="decimal" value={grossTotal} placeholder="e.g. 400" onChange={(e) => setGrossTotal(e.target.value)} />
        {preview != null && (
          <div className="mt-2 font-mono text-data-xs text-faint">
            = <span className="text-ink">${preview.toLocaleString()}</span> per account
          </div>
        )}

        <Button className="mt-4 w-full" onClick={() => act("blew")}>
          Blew all
        </Button>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button variant="payout" onClick={() => act("payout")}>
            Payout all
          </Button>
          <Button
            variant="ghost"
            className="border-invested/40 text-invested hover:bg-invested/10 hover:border-invested/40 hover:text-invested"
            onClick={investAll}
          >
            + Invest all
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
