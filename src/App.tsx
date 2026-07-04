import { useState } from "react";
import { useStore } from "@/store/StoreProvider";
import { useDialogs } from "@/components/ConfirmProvider";
import { selectionError, type PhaseFilter } from "@/lib/logic";
import { Header } from "@/components/Header";
import { TopStats } from "@/components/TopStats";
import { EquityCurve } from "@/components/EquityCurve";
import { PhaseFilters } from "@/components/PhaseFilters";
import { ClusterGrid } from "@/components/ClusterGrid";
import { PositionsTable } from "@/components/PositionsTable";
import { TodayLog } from "@/components/TodayLog";
import { Packages } from "@/components/Packages";
import { PnlHistory } from "@/components/PnlHistory";
import { FooterActions } from "@/components/FooterActions";
import { MultiBar } from "@/components/MultiBar";
import { LogModal } from "@/components/LogModal";
import { MultiLogModal } from "@/components/MultiLogModal";
import { DayDetailModal } from "@/components/DayDetailModal";
import { CapacityModal } from "@/components/CapacityModal";
import { SectionHeader } from "@/components/SectionHeader";

export default function App() {
  const store = useStore();
  const dialogs = useDialogs();

  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>("all");
  const [multiSel, setMultiSel] = useState<Set<string>>(new Set());
  const [logId, setLogId] = useState<string | null>(null);
  const [multiOpen, setMultiOpen] = useState(false);
  const [dayIdx, setDayIdx] = useState<number | null>(null);
  const [capOpen, setCapOpen] = useState(false);

  const toggleSelect = (id: string) => {
    setMultiSel((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      const err = selectionError(store.state, Array.from(next), id);
      if (err) {
        void dialogs.alert(err);
        return prev;
      }
      next.add(id);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-5 pb-24 sm:px-6">
      <Header />
      <TopStats onCapacityClick={() => setCapOpen(true)} />
      <EquityCurve />

      <SectionHeader>Clusters — tap an account to log · tick boxes to copy-trade</SectionHeader>
      <PhaseFilters value={phaseFilter} onChange={setPhaseFilter} />
      <ClusterGrid
        phaseFilter={phaseFilter}
        selected={multiSel}
        onToggleSelect={toggleSelect}
        onOpenSpot={(id) => setLogId(id)}
      />

      <SectionHeader>Active positions — deepest first</SectionHeader>
      <PositionsTable onOpenSpot={(id) => setLogId(id)} />

      <SectionHeader>Today's log</SectionHeader>
      <TodayLog />

      <SectionHeader>Packages — grouped by cluster color</SectionHeader>
      <Packages />

      <SectionHeader>P&L history — banked days</SectionHeader>
      <PnlHistory onOpenDay={(idx) => setDayIdx(idx)} />

      <FooterActions />

      <MultiBar
        count={multiSel.size}
        onLog={() => setMultiOpen(true)}
        onClear={() => setMultiSel(new Set())}
      />

      <LogModal id={logId} onClose={() => setLogId(null)} />
      <MultiLogModal
        open={multiOpen}
        ids={Array.from(multiSel)}
        onClose={() => setMultiOpen(false)}
        onDone={() => setMultiSel(new Set())}
      />
      {dayIdx != null && <DayDetailModal idx={dayIdx} onClose={() => setDayIdx(null)} />}
      <CapacityModal open={capOpen} onClose={() => setCapOpen(false)} />
    </div>
  );
}
