import type { ReactNode } from "react";
import { Sidebar, type ViewKey } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { FooterActions } from "@/components/FooterActions";

export function AppShell({
  active,
  onNavigate,
  children,
}: {
  active: ViewKey;
  onNavigate: (view: ViewKey) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-void text-ink">
      <Sidebar active={active} onNavigate={onNavigate} />
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
