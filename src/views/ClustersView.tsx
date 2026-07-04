import { ClustersSection } from "@/components/dashboard/ClustersSection";
import { PositionsTable } from "@/components/dashboard/PositionsTable";
import { Packages } from "@/components/dashboard/Packages";
import { SectionHeader } from "@/components/SectionHeader";
import { MultiBar } from "@/components/MultiBar";

export function ClustersView({
  selected,
  onToggleSelect,
  onOpenSpot,
  onLogSelected,
  onClearSelection,
}: {
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenSpot: (id: string) => void;
  onLogSelected: () => void;
  onClearSelection: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Clients</h1>
        <p className="text-sm text-dim">Tap an account to log · tick boxes to copy-trade.</p>
      </div>

      <ClustersSection selected={selected} onToggleSelect={onToggleSelect} onOpenSpot={onOpenSpot} />

      <div>
        <SectionHeader>Active positions — deepest first</SectionHeader>
        <PositionsTable onOpenSpot={onOpenSpot} />
      </div>

      <div>
        <SectionHeader>Packages — grouped by client color</SectionHeader>
        <Packages />
      </div>

      <MultiBar count={selected.size} onLog={onLogSelected} onClear={onClearSelection} />
    </div>
  );
}
