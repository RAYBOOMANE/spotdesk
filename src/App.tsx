import { useState } from "react";
import { useModals } from "@/hooks/useModals";
import { useMultiSelect } from "@/hooks/useMultiSelect";
import { AppShell } from "@/layouts/AppShell";
import type { ViewKey } from "@/components/layout/Sidebar";
import { HomeView } from "@/views/HomeView";
import { OverviewView } from "@/views/OverviewView";
import { ClustersView } from "@/views/ClustersView";
import { LogView } from "@/views/LogView";
import { HistoryView } from "@/views/HistoryView";
import { LogModal } from "@/components/modals/LogModal";
import { MultiLogModal } from "@/components/modals/MultiLogModal";
import { DayDetailModal } from "@/components/modals/DayDetailModal";
import { CapacityModal } from "@/components/modals/CapacityModal";

export default function App() {
  const [view, setView] = useState<ViewKey>("home");
  const { multiSel, toggleSelect, clearSelection } = useMultiSelect();
  const {
    logId,
    openLog,
    closeLog,
    multiOpen,
    openMulti,
    closeMulti,
    dayIdx,
    openDay,
    closeDay,
    capOpen,
    openCap,
    closeCap,
  } = useModals();

  return (
    <>
      <AppShell active={view} onNavigate={setView}>
        {view === "home" && <HomeView onNavigate={setView} />}
        {view === "overview" && <OverviewView onCapacityClick={openCap} />}
        {view === "clusters" && (
          <ClustersView
            selected={multiSel}
            onToggleSelect={toggleSelect}
            onOpenSpot={openLog}
            onLogSelected={openMulti}
            onClearSelection={clearSelection}
          />
        )}
        {view === "log" && <LogView />}
        {view === "history" && <HistoryView onOpenDay={openDay} />}
      </AppShell>

      <LogModal id={logId} onClose={closeLog} />
      <MultiLogModal open={multiOpen} ids={Array.from(multiSel)} onClose={closeMulti} onDone={clearSelection} />
      {dayIdx != null && <DayDetailModal idx={dayIdx} onClose={closeDay} />}
      <CapacityModal open={capOpen} onClose={closeCap} />
    </>
  );
}
