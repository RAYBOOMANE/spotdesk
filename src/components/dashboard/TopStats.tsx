import { useStore } from "@/store/StoreProvider";
import { computeTopStats } from "@/lib/stats";
import { cn, signed } from "@/lib/utils";
import { Card } from "@/components/ui/card";

function Stat({
  accent,
  k,
  v,
  vClass,
  sub,
  onClick,
  children,
}: {
  accent: "profit" | "loss" | "neutral";
  k: string;
  v: React.ReactNode;
  vClass?: string;
  sub?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <Card onClick={onClick} className="relative overflow-hidden p-4">
      <span
        className={cn(
          "absolute bottom-0 left-0 top-0 w-[3px]",
          accent === "profit" ? "bg-profit" : accent === "loss" ? "bg-loss" : "bg-line2"
        )}
      />
      <div className="mb-2 text-[0.56rem] font-medium uppercase tracking-[0.13em] text-dim">{k}</div>
      <div className={cn("font-mono text-2xl font-bold leading-none tracking-[-0.02em]", vClass)}>{v}</div>
      {sub && <div className="mt-2.5 font-mono text-[0.6rem] leading-relaxed text-faint">{sub}</div>}
      {children}
    </Card>
  );
}

export function TopStats({ onCapacityClick }: { onCapacityClick: () => void }) {
  const { state } = useStore();
  const s = computeTopStats(state);
  const tp = state.todayProfit;
  return (
    <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3">
      <Stat
        accent={tp >= 0 ? "profit" : "loss"}
        k="Profit · Today"
        v={signed(tp)}
        vClass={tp >= 0 ? "text-profit" : "text-loss"}
        sub={`${state.todayLog.filter((l) => l.type === "blew").length} blows`}
      />
      <Stat
        accent={s.monthPayouts >= 0 ? "profit" : "loss"}
        k="Payouts · This Month"
        v={signed(Math.round(s.monthPayouts))}
        vClass={s.monthPayouts >= 0 ? "text-profit" : "text-loss"}
        sub={`since ${s.monthStartLabel}`}
      />
      <Stat accent="neutral" k="Total Deployed Now" v={"$" + s.deployed.toLocaleString()} sub={`${s.liveCount} spots live`} />
      <Stat accent="neutral" k="Active Past D3 (D4+)" v={s.deepCount} sub="in the deep zone" />
      <Stat accent="neutral" k="In Second Leg (D8+)" v={s.secondLegCount} sub="past the gateway" />
      <Stat
        accent="neutral"
        k="Deployed Today"
        v={"$" + Math.round(state.deployedToday || 0).toLocaleString()}
        sub="new entries today"
      />
      <Stat accent="neutral" k="Expected Next Outcome" v={"+$" + s.fwdTotal.toFixed(0)} sub="forward EV" />
      <Stat accent="neutral" k="Capacity Used" v={s.capPct.toFixed(0) + "%"} onClick={onCapacityClick} sub={s.capLabel}>
        <div className="mt-2.5 h-[5px] overflow-hidden rounded-[3px] bg-panel2">
          <div className="h-full rounded-[3px] bg-dim transition-all" style={{ width: Math.min(100, s.capPct) + "%" }} />
        </div>
      </Stat>
    </div>
  );
}
