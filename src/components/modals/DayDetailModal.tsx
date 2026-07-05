import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/StoreProvider";
import { netOfLog } from "@/lib/logic";
import { signed } from "@/lib/utils";

function Cell({
  label,
  value,
  onChange,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-mono text-[0.56rem] text-dim">{label}</span>
      <input
        inputMode={numeric ? "numeric" : "decimal"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[7px] border border-line bg-panel2 px-2.5 py-2 font-mono text-[0.8rem] text-ink focus:border-line2 focus:outline-none"
      />
    </div>
  );
}

export function DayDetailModal({ idx, onClose }: { idx: number | null; onClose: () => void }) {
  const store = useStore();
  const d = idx != null ? store.state.history[idx] : undefined;
  const [profit, setProfit] = useState("");
  const [payoutGross, setPayoutGross] = useState("");
  const [payoutProfit, setPayoutProfit] = useState("");
  const [deployed, setDeployed] = useState("");
  const [blown, setBlown] = useState("");

  useEffect(() => {
    if (!d) return;
    const blownCount = d.blownOverride != null ? d.blownOverride : (d.log || []).filter((l) => l.type === "blew").length;
    setProfit(String(d.profit));
    setPayoutGross(
      String(d.payoutGross != null ? d.payoutGross : (d.log || []).filter((l) => l.type === "payout").reduce((s, l) => s + (l.amount || 0), 0))
    );
    setPayoutProfit(String(d.payouts || 0));
    setDeployed(String(d.deployed || 0));
    setBlown(String(blownCount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  if (idx == null || !d) return null;
  const dt = d.date
    ? new Date(d.date).toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short", year: "numeric" })
    : "";

  // This day's own log entries are the authoritative record of what actually
  // happened. If the day's declared total doesn't match what those entries
  // sum to, someone has manually overridden it below -- flag it plainly
  // rather than let the mismatch sit invisible. (Per-manager/package
  // breakdowns elsewhere always reflect the raw entries, never this override.)
  const logSum = (d.log || []).reduce((s, w) => s + netOfLog(w), 0);
  const hasOverride = Math.abs(logSum - d.total) > 0.01;

  const save = () => {
    store.editHistoryDay(idx, {
      profit: parseFloat(profit),
      payoutGross: parseFloat(payoutGross),
      payouts: parseFloat(payoutProfit),
      deployed: parseFloat(deployed),
      blownOverride: parseInt(blown, 10),
    });
    onClose();
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>Day {d.day} detail</DialogTitle>
        <DialogDescription>
          {dt} · total +${d.total.toLocaleString()} (blows +${d.profit.toLocaleString()} · payout profit +$
          {(d.payouts || 0).toLocaleString()}) · deployed ${(d.deployed || 0).toLocaleString()}
        </DialogDescription>

        {hasOverride && (
          <div className="mb-3 rounded-lg border border-invested/40 bg-invested/10 px-3 py-2 font-mono text-[0.62rem] leading-relaxed text-invested">
            Manual override active — this day's declared total ({signed(d.total)}) doesn't match what its own log
            entries sum to ({signed(Math.round(logSum * 100) / 100)}). Accounting's Net P&amp;L and history charts use
            the declared total; Managers/Package breakdowns use the raw entries and won't reflect this override.
          </div>
        )}

        <div className="mb-1 text-[0.58rem] uppercase tracking-[0.1em] text-dim">Edit this day's totals</div>
        <div className="grid grid-cols-2 gap-2">
          <Cell label="Profit (blows) $" value={profit} onChange={setProfit} />
          <Cell label="Payout gross $" value={payoutGross} onChange={setPayoutGross} />
          <Cell label="Payout profit $" value={payoutProfit} onChange={setPayoutProfit} />
          <Cell label="Deployed $" value={deployed} onChange={setDeployed} />
          <Cell label="# Blown" value={blown} onChange={setBlown} numeric />
        </div>

        <div className="mt-3 flex max-h-[220px] flex-col gap-1 overflow-y-auto">
          {!d.log || d.log.length === 0 ? (
            <div className="p-3.5 text-center font-mono text-[0.66rem] text-faint">
              No individual entries recorded.
            </div>
          ) : (
            d.log
              .slice()
              .reverse()
              .map((w, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2.5 rounded-lg border border-line bg-panel px-3 py-2 font-mono text-[0.66rem]"
                >
                  <span className="w-[54px] text-faint">{w.time}</span>
                  <span className="w-[60px] text-dim">
                    C{w.id.split("-")[0]}·A{w.id.split("-")[1]}
                  </span>
                  <span className="flex-1 text-ink">
                    {w.type === "payout" ? (
                      <>
                        <span className="text-dim">payout</span> D{w.day}{" "}
                        <span className="text-[0.58rem] text-faint">
                          (${w.amount}−${w.invested})
                        </span>
                      </>
                    ) : (
                      <>blew D{w.day}</>
                    )}
                  </span>
                  <span className="font-bold text-profit">
                    +${(w.profit != null && w.type === "payout" ? w.profit : w.amount).toLocaleString()}
                  </span>
                </div>
              ))
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="set" onClick={save}>
            Save changes
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
