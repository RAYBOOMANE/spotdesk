import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DayRow } from "./DayRow";
import { LADDER } from "@/lib/ladder";
import { cumInvest, fwdEV } from "@/lib/logic";
import { useStore } from "@/store/StoreProvider";
import type { OutcomeType } from "@/lib/types";

function parseMaybe(v: string): number | null {
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

export function LogModal({ id, onClose }: { id: string | null; onClose: () => void }) {
  const store = useStore();
  const [day, setDay] = useState(1);
  const [cost, setCost] = useState("");
  const [extra, setExtra] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    if (!id) return;
    const sp = store.state.spots[id];
    setDay(sp && sp.day >= 1 ? sp.day : 1);
    setCost(sp && sp.cost ? String(sp.cost) : "");
    setExtra(sp && sp.extra ? String(sp.extra) : "");
    setAmount("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const L = LADDER[day];
  const preview = useMemo(() => {
    const typedCost = parseMaybe(cost);
    const ex = parseMaybe(extra) ?? 0;
    const invested = (typedCost == null ? cumInvest(day) : typedCost) + ex;
    const usingBenchmark = typedCost == null;
    const gross = parseMaybe(amount);
    const src = usingBenchmark
      ? `benchmark $${invested.toLocaleString()}`
      : `your $${invested.toLocaleString()} invested`;
    if (gross == null) return { text: `On blow: net = gross − ${src}. Enter gross to preview.`, net: null as number | null };
    const net = gross - invested;
    return {
      text: `On blow: $${gross.toLocaleString()} − $${invested.toLocaleString()} =`,
      net: Math.round(net * 100) / 100,
    };
  }, [cost, extra, amount, day]);

  if (!id) return null;
  const [c, a] = id.split("-");

  const act = (fn: () => void) => {
    fn();
    onClose();
  };
  const outcome = (type: OutcomeType) =>
    act(() => store.logOutcomeSingle(id, day, type, parseMaybe(cost), parseMaybe(extra), parseMaybe(amount)));

  return (
    <Dialog open={!!id} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>
          Cluster {c} · Account {a}
        </DialogTitle>
        <DialogDescription>Set the day, enter true costs, then pick an outcome.</DialogDescription>

        <Label>Day on ladder</Label>
        <DayRow value={day} onChange={setDay} />

        <div className="mb-4 rounded-lg bg-panel2 px-2.5 py-2 font-mono text-[0.6rem] leading-relaxed text-faint">
          Day {day}: benchmark cost <b className="text-gold">${L.inv}</b> · win chance{" "}
          <b className="text-gold">{(L.p * 100).toFixed(1)}%</b> · forward EV{" "}
          <b className="text-gold">~${fwdEV(day).toFixed(0)}</b>
        </div>

        <div className="mb-1 grid grid-cols-2 gap-2.5">
          <div>
            <Label>Account / ladder cost</Label>
            <Input inputMode="decimal" value={cost} placeholder={String(L.inv)} onChange={(e) => setCost(e.target.value)} />
          </div>
          <div>
            <Label>Extra investment now</Label>
            <Input inputMode="decimal" value={extra} placeholder="0" onChange={(e) => setExtra(e.target.value)} />
          </div>
        </div>
        <div className="mt-3">
          <Label>Total profit received (gross)</Label>
          <Input
            inputMode="decimal"
            value={amount}
            placeholder={String(L.prof)}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="my-4 rounded-lg bg-panel2 px-2.5 py-2 font-mono text-[0.6rem] leading-relaxed text-faint">
          {preview.text}{" "}
          {preview.net != null && (
            <b style={{ color: preview.net >= 0 ? "var(--profit)" : "var(--loss)" }}>
              {preview.net >= 0 ? "+" : ""}${preview.net.toLocaleString()} net
            </b>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button onClick={() => outcome("blew")}>Blew +$ (restart)</Button>
          <Button variant="payout" onClick={() => outcome("payout")}>
            Payout +$ (keep)
          </Button>
          <Button
            variant="set"
            onClick={() => act(() => store.setDaySingle(id, day, parseMaybe(cost), parseMaybe(extra)))}
          >
            Set Day
          </Button>
          <Button variant="ghost" onClick={() => act(() => store.freeSpot(id))}>
            Free slot
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
