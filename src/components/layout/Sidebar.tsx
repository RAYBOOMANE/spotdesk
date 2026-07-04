import type { ComponentType } from "react";
import { History, House, LayoutDashboard, LayoutGrid, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewKey = "home" | "overview" | "clusters" | "log" | "history";

const NAV_ITEMS: { key: ViewKey; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { key: "home", label: "Home", icon: House },
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "clusters", label: "Clusters", icon: LayoutGrid },
  { key: "log", label: "Log", icon: ScrollText },
  { key: "history", label: "History", icon: History },
];

export function Sidebar({
  active,
  onNavigate,
}: {
  active: ViewKey;
  onNavigate: (view: ViewKey) => void;
}) {
  return (
    <nav className="flex w-56 shrink-0 flex-col border-r border-line bg-panel px-3 py-5">
      <div className="mb-6 px-2 text-sm font-bold tracking-tight text-ink">
        SPOT<span className="text-dim">DESK</span>
      </div>
      <ul className="flex flex-col gap-1">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const isActive = active === key;
          return (
            <li key={key}>
              <button
                onClick={() => onNavigate(key)}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive ? "bg-panel2 text-ink" : "text-dim hover:bg-panel2 hover:text-ink"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
