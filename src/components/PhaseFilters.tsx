import { phaseCounts } from "@/lib/stats";
import type { PhaseFilter } from "@/lib/logic";
import { useStore } from "@/store/StoreProvider";
import { cn } from "@/lib/utils";

const FILTERS: { key: PhaseFilter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "1", label: "D1" },
  { key: "2", label: "D2" },
  { key: "3", label: "D3" },
  { key: "4-7", label: "D4–7" },
  { key: "8-12", label: "D8–12" },
];

export function PhaseFilters({
  value,
  onChange,
}: {
  value: PhaseFilter;
  onChange: (p: PhaseFilter) => void;
}) {
  const { state } = useStore();
  const counts = phaseCounts(state);
  return (
    <div className="mb-3 flex flex-wrap gap-1.5">
      {FILTERS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={cn(
            "rounded-lg border px-3.5 py-1.5 font-mono text-[0.66rem] transition-colors",
            value === f.key
              ? "border-ink bg-ink font-bold text-void"
              : "border-line bg-panel text-dim hover:border-line2 hover:bg-panel2 hover:text-ink"
          )}
        >
          {f.label}
          {counts[f.key] > 0 && <span className="ml-1 opacity-70">{counts[f.key]}</span>}
        </button>
      ))}
    </div>
  );
}
