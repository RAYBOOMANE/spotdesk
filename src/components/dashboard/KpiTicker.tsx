import { useStore } from "@/store/StoreProvider";
import { computeTopStats, openSessionCapital } from "@/lib/stats";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

function Item({
  k,
  v,
  vClass,
  sub,
}: {
  k: string;
  v: React.ReactNode;
  vClass?: string;
  sub?: string;
}) {
  return (
    <div className="min-w-[150px] flex-1 px-5 first:pl-0 last:pr-0">
      <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">{k}</div>
      <div className={cn("font-mono text-data-xl font-bold text-ink", vClass)}>{v}</div>
      {sub && <div className="mt-1 font-mono text-data-xs text-faint">{sub}</div>}
    </div>
  );
}

export function KpiTicker() {
  const { state } = useStore();
  const s = computeTopStats(state);
  const openSession = openSessionCapital(state);

  return (
    <Card className="flex flex-wrap divide-x divide-line px-6 py-5">
      <Item
        k="Payouts · This Month"
        v={(s.monthPayouts >= 0 ? "+$" : "-$") + Math.abs(Math.round(s.monthPayouts)).toLocaleString()}
        vClass={s.monthPayouts >= 0 ? "text-profit" : "text-loss"}
        sub={`since ${s.monthStartLabel}`}
      />
      <Item k="Total Deployed Now" v={"$" + s.deployed.toLocaleString()} sub={`${s.liveCount} spots live`} />
      <Item k="Active Past D3 (D4+)" v={s.deepCount} sub="in the deep zone" />
      <Item k="In Second Leg (D8+)" v={s.secondLegCount} sub="past the gateway" />
      <Item
        k="Open Session Capital"
        v={"$" + Math.round(openSession).toLocaleString()}
        sub="live — today's open trades only"
      />
      <Item k="Expected Next Outcome" v={"+$" + s.fwdTotal.toFixed(0)} sub="forward EV" />
    </Card>
  );
}
