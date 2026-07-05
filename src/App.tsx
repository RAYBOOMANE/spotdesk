import { useState } from "react";
import { useModals } from "@/hooks/useModals";
import { useMultiSelect } from "@/hooks/useMultiSelect";
import { useNowTrading } from "@/hooks/useNowTrading";
import { AppShell } from "@/layouts/AppShell";
import { HomeView } from "@/views/HomeView";
import { OverviewView } from "@/views/OverviewView";
import { ClustersView } from "@/views/ClustersView";
import { LogView } from "@/views/LogView";
import { HistoryView } from "@/views/HistoryView";
import { PlaceholderView } from "@/views/PlaceholderView";
import { NowTradingView } from "@/views/NowTradingView";
import { ObjectivesView } from "@/views/ObjectivesView";
import { CeoOverviewView } from "@/views/CeoOverviewView";
import { CeoClientsView } from "@/views/CeoClientsView";
import { LogModal } from "@/components/modals/LogModal";
import { MultiLogModal } from "@/components/modals/MultiLogModal";
import { DayDetailModal } from "@/components/modals/DayDetailModal";
import { CapacityModal } from "@/components/modals/CapacityModal";
import { defaultTab, type Department } from "@/config/departments";

export default function App() {
  const [screen, setScreen] = useState<"home" | Department>("home");
  const [tab, setTab] = useState<string>("overview");
  const { multiSel, toggleSelect, clearSelection } = useMultiSelect();
  const nowTrading = useNowTrading();
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

  const enterDepartment = (d: Department) => {
    setScreen(d);
    setTab(defaultTab(d));
  };

  if (screen === "home") {
    return <HomeView onSelectDepartment={enterDepartment} />;
  }

  const department = screen;

  return (
    <>
      <AppShell
        department={department}
        tab={tab}
        onTabChange={setTab}
        onSwitchDepartment={enterDepartment}
        onHome={() => setScreen("home")}
      >
        {department === "trading-floor" && tab === "overview" && <OverviewView onCapacityClick={openCap} />}
        {department === "trading-floor" && tab === "clients" && (
          <ClustersView
            selected={multiSel}
            onToggleSelect={toggleSelect}
            onOpenSpot={openLog}
            onLogSelected={openMulti}
            onClearSelection={clearSelection}
          />
        )}
        {department === "trading-floor" && tab === "now-trading" && (
          <NowTradingView
            onOpenSpot={openLog}
            selected={nowTrading.selected}
            onToggle={nowTrading.toggle}
            onRemove={nowTrading.remove}
            max={nowTrading.max}
          />
        )}
        {department === "trading-floor" && tab === "log" && <LogView />}
        {department === "trading-floor" && tab === "history" && <HistoryView onOpenDay={openDay} />}

        {department === "ceo-office" && tab === "overview" && <CeoOverviewView />}
        {department === "ceo-office" && tab === "clients" && <CeoClientsView />}
        {department === "ceo-office" && tab === "managers" && (
          <PlaceholderView title="Managers" description="Manager roster, assigned clients, and profit splits." />
        )}
        {department === "ceo-office" && tab === "money-held" && (
          <PlaceholderView title="Money Held" description="Capital held on behalf of clients and managers." />
        )}
        {department === "ceo-office" && tab === "objectives" && <ObjectivesView />}
        {department === "accounting" && (
          <PlaceholderView
            title="Accounting"
            description="A financial ledger generated from Trading Floor activity."
          />
        )}
        {department === "secretary" && (
          <PlaceholderView title="Secretary" description="To-do lists and operational follow-ups." />
        )}
      </AppShell>

      <LogModal id={logId} onClose={closeLog} />
      <MultiLogModal open={multiOpen} ids={Array.from(multiSel)} onClose={closeMulti} onDone={clearSelection} />
      {dayIdx != null && <DayDetailModal idx={dayIdx} onClose={closeDay} />}
      <CapacityModal open={capOpen} onClose={closeCap} />
    </>
  );
}
