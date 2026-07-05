import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/StoreProvider";
import { useDialogs } from "@/components/ConfirmProvider";
import { signed } from "@/lib/utils";

function parseMaybe(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

// Accounting → "Open source" for a TODAY row. Deliberately NOT the shared
// LogModal: this only corrects the numbers on the ONE existing log entry it
// was opened for. It never touches state.spots[id] — no Set Day, no Blew/
// Payout "log a new outcome" workflow, no Free slot. Saving reverses this
// entry's old net effect and applies the edited one (editTodayLogEntry);
// Delete is a separate, clearly-dangerous action using the same deleteLog
// used everywhere else.
export function EditSourceEntryModal({
  todayLogIndex,
  onClose,
}: {
  todayLogIndex: number | null;
  onClose: () => void;
}) {
  const store = useStore();
  const dialogs = useDialogs();
  const entry = todayLogIndex != null ? store.state.todayLog[todayLogIndex] : undefined;

  const [amount, setAmount] = useState("");
  const [invested, setInvested] = useState("");
  const [note, setNote] = useState("");
  const [time, setTime] = useState("");

  useEffect(() => {
    if (!entry) return;
    setAmount(String(entry.amount));
    setInvested(String(entry.type === "blew" ? entry.sunk || 0 : entry.invested || 0));
    setNote(entry.note || "");
    setTime(entry.time);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayLogIndex]);

  if (todayLogIndex == null || !entry) return null;

  const amt = parseMaybe(amount);
  const inv = parseMaybe(invested);
  const previewNet = (amt ?? 0) - (inv ?? 0);

  const save = () => {
    if (amt == null || inv == null) {
      void dialogs.alert("Enter valid numbers for both amounts before saving.");
      return;
    }
    store.editTodayLogEntry(todayLogIndex, { amount: amt, invested: inv, note, time });
    onClose();
  };

  const del = async () => {
    const ok = await dialogs.confirm(
      `Delete this ${entry.type} entry for ${entry.id}?\nToday's totals will be adjusted back.`,
      { confirmLabel: "Delete entry", danger: true }
    );
    if (ok) {
      store.deleteLog(todayLogIndex);
      onClose();
    }
  };

  const investedLabel = entry.type === "blew" ? "Investment lost ($)" : "Amount invested ($)";
  const amountLabel = entry.type === "blew" ? "Gross profit before blow ($)" : "Payout received ($)";

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Edit source entry</DialogTitle>
        <DialogDescription>
          {entry.type === "blew" ? "Blew" : "Payout"} on {entry.id}, D{entry.day} · logged {entry.time}. This only
          corrects this entry's own numbers — it never creates a new log, opens a new account, or changes the
          account's current day or cost.
        </DialogDescription>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <Label>{investedLabel}</Label>
            <Input inputMode="decimal" value={invested} onChange={(e) => setInvested(e.target.value)} />
          </div>
          <div>
            <Label>{amountLabel}</Label>
            <Input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
        </div>

        <div className="mt-3">
          <Label>Note / reason (optional)</Label>
          <Input value={note} placeholder="Why this was corrected" onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="mt-3">
          <Label>Time logged</Label>
          <Input value={time} onChange={(e) => setTime(e.target.value)} />
        </div>

        <div className="my-4 rounded-lg bg-panel2 px-2.5 py-2 font-mono text-[0.62rem] leading-relaxed text-faint">
          New net:{" "}
          <b style={{ color: previewNet >= 0 ? "var(--profit)" : "var(--loss)" }}>
            {signed(Math.round(previewNet * 100) / 100)}
          </b>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="set" onClick={save}>
            Save changes
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
        <button
          onClick={del}
          className="mt-2 w-full rounded-lg border border-loss/40 px-2.5 py-2 text-[0.72rem] font-bold text-loss transition-colors hover:bg-loss/10"
        >
          Delete entry
        </button>
      </DialogContent>
    </Dialog>
  );
}
