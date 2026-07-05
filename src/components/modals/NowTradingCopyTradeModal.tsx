import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/StoreProvider";

function parseMaybe(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// A dedicated Now Trading copy-trade modal — NOT the shared MultiLogModal
// (that stays untouched for Clusters). The one difference the user asked
// for: you type the TOTAL gross across all accounts, not the per-account
// amount — e.g. blowing 2 accounts at $200 each, you enter 400 once and it's
// split evenly before being passed to the existing multiOutcome.
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
  const [grossTotal, setGrossTotal] = useState("");
  const n = ids.length;

  const perAccount = () => {
    const total = parseMaybe(grossTotal);
    return total == null ? null : total / n;
  };

  const act = (type: "blew" | "payout") => {
    store.multiOutcome(ids, day, type, null, null, perAccount());
    setGrossTotal("");
    onClose();
  };

  const preview = perAccount();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Copy trade · D{day}</DialogTitle>
        <DialogDescription>
          Applies to {n} accounts: {ids.join(", ")}. Enter the TOTAL gross amount across all {n} — it's split evenly
          per account.
        </DialogDescription>

        <Label>Gross amount (total across {n} accounts)</Label>
        <Input inputMode="decimal" value={grossTotal} placeholder="e.g. 400" onChange={(e) => setGrossTotal(e.target.value)} />
        {preview != null && (
          <div className="mt-2 font-mono text-data-xs text-faint">
            = <span className="text-ink">${preview.toLocaleString()}</span> per account
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button onClick={() => act("blew")}>Blew all</Button>
          <Button variant="payout" onClick={() => act("payout")}>
            Payout all
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
