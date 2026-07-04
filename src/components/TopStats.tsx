import { useStore } from "@/store/StoreProvider";
import { computeTopStats } from "@/lib/stats";
import { cn, signed } from "@/lib/utils";

function Stat({
  accent,
  k,
  v,
  vClass,
  vStyle,
  sub,
  onClick,
  children,
}: {
  accent: string;
  k: string;
  v: React.ReactNode;
  vClass?: string;
  vStyle?: React.CSSProperties;
  sub?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative overflow-hidden rounded-card border border-line bg-gradient-to-b from-panel via-panel to-[rgba(21,27,39,0.6)] p-4 shadow-card transition-colors hover:border-line2",
        onClick && "cursor-pointer"
      )}
    >
      <span className="absolute bottom-0 left-0 top-0 w-[3px]" style={{ background: accent }} />
      <div className="mb-2 text-[0.56rem] font-medium uppercase tracking-[0.13em] text-dim">{k}</div>
      <div className={cn("font-mono text-2xl font-bold leading-none", vClass)} style={vStyle}>
        {v}
      </div>
      {sub && <div className="mt-2 font-mono text-[0.6rem] text-faint">{sub}</div>}
      {children}
    </div>
  );
}

export function TopStats({ onCapacityClick }: { onCapacityClick: () => void }) {
  const { state } = useStore();
  const s = computeTopStats(state);
  const tp = state.todayProfit;
  return (
    <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(158px,1fr))] gap-3">
      <Stat
        accent="var(--profit)"
        k="Profit · Today"
        v={signed(tp)}
        vClass={tp >= 0 ? "text-live" : "text-loss"}
        sub={`${state.todayLog.filter((l) => l.type === "blew").length} blows`}
      />
      <Stat
        accent="var(--payout)"
        k="Payouts · This Month"
        v={"+$" + Math.round(s.monthPayouts).toLocaleString()}
        vClass="text-payout"
        sub={`since ${s.monthStartLabel}`}
      />
      <Stat
        accent="var(--cool)"
        k="Total Deployed Now"
        v={"$" + s.deployed.toLocaleString()}
        sub={`${s.liveCount} spots live`}
      />
      <Stat
        accent="var(--deep)"
        k="Active Past D3 (D4+)"
        v={s.deepCount}
        vStyle={{ color: s.deepCount > 0 ? "var(--deep)" : "var(--ink)" }}
        sub="in the deep zone"
      />
      <Stat
        accent="var(--cool)"
        k="In Second Leg (D8+)"
        v={s.secondLegCount}
        vStyle={{ color: s.secondLegCount > 0 ? "var(--cool)" : "var(--ink)" }}
        sub="past the gateway"
      />
      <Stat
        accent="var(--gold)"
        k="Deployed Today"
        v={"$" + Math.round(state.deployedToday || 0).toLocaleString()}
        sub="new entries today"
      />
      <Stat accent="var(--gold)" k="Expected Next Outcome" v={"+$" + s.fwdTotal.toFixed(0)} sub="forward EV" />
      <Stat
        accent="var(--live)"
        k="Capacity Used"
        v={s.capPct.toFixed(0) + "%"}
        onClick={onCapacityClick}
        sub={s.capLabel}
      >
        <div className="mt-2.5 h-[5px] overflow-hidden rounded-[3px] bg-free">
          <div
            className="h-full rounded-[3px] bg-gradient-to-r from-live to-cool transition-all"
            style={{ width: Math.min(100, s.capPct) + "%" }}
          />
        </div>
      </Stat>
    </div>
  );
}
