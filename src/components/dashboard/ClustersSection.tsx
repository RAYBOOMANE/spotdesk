import { useState } from "react";
import { type PhaseFilter } from "@/lib/logic";
import { PhaseFilters } from "@/components/PhaseFilters";
import { ClusterGrid } from "@/components/dashboard/ClusterGrid";

export function ClustersSection({
  selected,
  onToggleSelect,
  onOpenSpot,
}: {
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenSpot: (id: string) => void;
}) {
  const [phaseFilter, setPhaseFilter] = useState<PhaseFilter>("all");
  return (
    <>
      <PhaseFilters value={phaseFilter} onChange={setPhaseFilter} />
      <ClusterGrid
        phaseFilter={phaseFilter}
        selected={selected}
        onToggleSelect={onToggleSelect}
        onOpenSpot={onOpenSpot}
      />
    </>
  );
}
