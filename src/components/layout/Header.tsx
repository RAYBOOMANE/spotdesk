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
    <header className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line bg-panel px-6 py-4">
      <div className="flex items-center gap-2 font-mono text-xs text-dim">
        <span className="font-bold text-loss">{s.blewCount} blown</span>
        <span className="text-line2">·</span>
        <span className="font-bold text-profit">{s.leftToTrade}</span>
        <span>left to trade</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="rounded-md border border-line bg-panel2 px-3 py-1.5 font-mono text-xs tracking-wide text-dim">
          {dateLabel}
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 font-mono text-xs",
            saveStatus.ok === false ? "bg-loss/10 font-bold text-loss" : "bg-profit/10 text-profit"
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {saveStatus.ok === null
            ? "initializing"
            : saveStatus.ok
            ? `saved to SQLite ${saveStatus.time}`
            : "NOT saving — export a backup!"}
        </div>
      </div>
    </header>
  );
}
