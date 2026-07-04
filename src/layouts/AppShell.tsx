import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { FooterActions } from "@/components/FooterActions";
import type { Department } from "@/config/departments";

export function AppShell({
  department,
  tab,
  onTabChange,
  onSwitchDepartment,
  onHome,
  children,
}: {
  department: Department;
  tab: string;
  onTabChange: (tab: string) => void;
  onSwitchDepartment: (d: Department) => void;
  onHome: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-void text-ink">
      <Sidebar
        department={department}
        tab={tab}
        onTabChange={onTabChange}
        onSwitchDepartment={onSwitchDepartment}
        onHome={onHome}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto flex min-h-full max-w-[1400px] flex-col gap-6 px-6 py-6">{children}</div>
        </main>
        <footer className="border-t border-line bg-panel px-6 py-3">
          <FooterActions />
        </footer>
      </div>
    </div>
  );
}
