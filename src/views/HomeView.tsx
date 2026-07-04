import { History, LayoutDashboard, LayoutGrid, ScrollText } from "lucide-react";
import { useStore } from "@/store/StoreProvider";
import { computeTopStats } from "@/lib/stats";
import { signed } from "@/lib/utils";
import { CircularNav } from "@/components/layout/CircularNav";
import type { ViewKey } from "@/components/layout/Sidebar";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning.";
  if (h < 18) return "Good afternoon.";
  return "Good evening.";
}

const NAV_ITEMS = [
  { key: "overview" as ViewKey, label: "Overview", icon: LayoutDashboard },
  { key: "clusters" as ViewKey, label: "Clusters", icon: LayoutGrid },
  { key: "log" as ViewKey, label: "Log", icon: ScrollText },
  { key: "history" as ViewKey, label: "History", icon: History },
];

export function HomeView({ onNavigate }: { onNavigate: (view: ViewKey) => void }) {
  const { state } = useStore();
  const s = computeTopStats(state);
  const todayTotal = state.todayProfit + state.todayPayouts;
  const dateLabel = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "short" });

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 py-10 text-center">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{greeting()}</h1>
        <p className="mt-1.5 font-mono text-xs text-dim">
          DAY {state.dayCount} · {dateLabel}
        </p>
        <p className="mt-3 text-sm text-dim">
          <span className="font-semibold text-ink">{s.leftToTrade}</span> left to trade · {signed(Math.round(todayTotal))} today
        </p>
      </div>

      <CircularNav
        items={NAV_ITEMS}
        onSelect={onNavigate}
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
