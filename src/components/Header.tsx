import { useStore } from "@/store/StoreProvider";
import { computeTopStats } from "@/lib/stats";
import { cn } from "@/lib/utils";

export function Header() {
  const { state, saveStatus } = useStore();
  const s = computeTopStats(state);
  const dateLabel =
    "DAY " +
    state.dayCount +
    " · " +
    new Date().toLocaleDateString("en-GB", { weekday: "short", day: "2-digit", month: "short" });
  return (
    <header className="mb-5 flex flex-wrap items-center justify-between gap-2.5 border-b border-line2 pb-4">
      <div className="flex flex-col gap-1">
        <div className="text-[1.35rem] font-bold tracking-[-0.03em]">
          SPOT<span className="text-live">DESK</span>
        </div>
        <div className="font-mono text-[0.6rem] text-dim">
          <span className="text-loss">{s.blewCount} blown</span> · <b className="text-live">{s.leftToTrade}</b> left
          to trade
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <div className="rounded-lg border border-line bg-panel px-3 py-1.5 font-mono text-[0.7rem] tracking-[0.03em] text-dim">
          {dateLabel}
        </div>
        <div
          className={cn(
            "rounded-md px-2 py-0.5 font-mono text-[0.56rem] tracking-[0.03em]",
            saveStatus.ok === false
              ? "save-bad bg-[rgba(255,97,120,0.12)] font-bold text-loss"
              : "bg-[rgba(45,212,167,0.08)] text-live"
          )}
        >
          {saveStatus.ok === null
            ? "● initializing"
            : saveStatus.ok
            ? `● saved to SQLite ${saveStatus.time}`
            : "⚠ NOT saving — export a backup!"}
        </div>
      </div>
    </header>
  );
}
