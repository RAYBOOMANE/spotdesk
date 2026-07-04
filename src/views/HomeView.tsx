import { useStore } from "@/store/StoreProvider";
import { computeTopStats } from "@/lib/stats";
import { signed } from "@/lib/utils";
import { CircularNav } from "@/components/layout/CircularNav";
import { DEPARTMENTS, type Department } from "@/config/departments";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning.";
  if (h < 18) return "Good afternoon.";
  return "Good evening.";
}

// The Welcome screen — stands alone, full-screen, no sidebar/header/footer
// chrome. Selecting a department hands off to the AppShell.
export function HomeView({ onSelectDepartment }: { onSelectDepartment: (d: Department) => void }) {
  const { state } = useStore();
  const s = computeTopStats(state);
  const todayTotal = state.todayProfit + state.todayPayouts;
  const dateLabel = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short" });

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-10 bg-void px-6 py-10 text-center text-ink">
      <div>
        <div className="mb-3 text-sm font-bold tracking-tight text-ink">
          SPOT<span className="text-dim">DESK</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{greeting()}</h1>
        <p className="mt-1.5 font-mono text-xs text-dim">
          DAY {state.dayCount} · {dateLabel}
        </p>
        <p className="mt-3 text-sm text-dim">
          <span className="font-semibold text-ink">{s.leftToTrade}</span> left to trade · {signed(Math.round(todayTotal))} today
        </p>
      </div>

      <CircularNav
        items={DEPARTMENTS}
        onSelect={onSelectDepartment}
        center={
          <span className="font-mono text-[0.62rem] text-dim">
            DAY
            <br />
            <span className="text-base font-bold text-ink">{state.dayCount}</span>
          </span>
        }
      />
    </div>
  );
}
