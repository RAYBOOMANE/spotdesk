import type { ComponentType } from "react";
import {
  Briefcase,
  Calculator,
  ClipboardList,
  History,
  LayoutDashboard,
  LayoutGrid,
  LineChart,
  ScrollText,
  Zap,
} from "lucide-react";

// Pure UI navigation config — no business logic, no store access.

export type Department = "trading-floor" | "ceo-office" | "accounting" | "secretary";

export interface DepartmentMeta {
  key: Department;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const DEPARTMENTS: DepartmentMeta[] = [
  { key: "trading-floor", label: "Trading Floor", icon: LineChart },
  { key: "ceo-office", label: "CEO Office", icon: Briefcase },
  { key: "accounting", label: "Accounting", icon: Calculator },
  { key: "secretary", label: "Secretary", icon: ClipboardList },
];

export interface TabMeta {
  key: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const DEPARTMENT_TABS: Record<Department, TabMeta[]> = {
  "trading-floor": [
    { key: "overview", label: "Overview", icon: LayoutDashboard },
    { key: "clients", label: "Clients", icon: LayoutGrid },
    { key: "now-trading", label: "Now Trading", icon: Zap },
    { key: "log", label: "Log", icon: ScrollText },
    { key: "history", label: "History", icon: History },
  ],
  "ceo-office": [{ key: "overview", label: "Overview", icon: LayoutDashboard }],
  accounting: [{ key: "overview", label: "Overview", icon: LayoutDashboard }],
  secretary: [{ key: "overview", label: "Overview", icon: LayoutDashboard }],
};

export function defaultTab(dept: Department): string {
  return DEPARTMENT_TABS[dept][0].key;
}

export function departmentLabel(dept: Department): string {
  return DEPARTMENTS.find((d) => d.key === dept)?.label ?? dept;
}
