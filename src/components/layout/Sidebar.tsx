import { DEPARTMENT_TABS, type Department } from "@/config/departments";
import { DepartmentSwitcher } from "@/components/layout/DepartmentSwitcher";
import { cn } from "@/lib/utils";

export function Sidebar({
  department,
  tab,
  onTabChange,
  onSwitchDepartment,
  onHome,
}: {
  department: Department;
  tab: string;
  onTabChange: (tab: string) => void;
  onSwitchDepartment: (d: Department) => void;
  onHome: () => void;
}) {
  const tabs = DEPARTMENT_TABS[department];

  return (
    <nav className="flex w-56 shrink-0 flex-col border-r border-line bg-panel px-3 py-5">
      <button
        onClick={onHome}
        className="mb-6 px-2 text-left text-sm font-bold tracking-tight text-ink transition-colors hover:text-dim"
        title="Back to Welcome"
      >
        SPOT<span className="text-dim">DESK</span>
      </button>

      <DepartmentSwitcher active={department} onSelect={onSwitchDepartment} />

      <ul className="flex flex-col gap-1">
        {tabs.map(({ key, label, icon: Icon }) => {
          const isActive = tab === key;
          return (
            <li key={key}>
              <button
                onClick={() => onTabChange(key)}
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
