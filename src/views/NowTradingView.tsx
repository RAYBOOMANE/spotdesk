import { useState } from "react";
import { useStore } from "@/store/StoreProvider";
import { computeTopStats } from "@/lib/stats";
import { clusterOf, colorOf } from "@/lib/logic";
import { NowTradingCard } from "@/components/dashboard/NowTradingCard";
import { NowTradingPickerModal } from "@/components/modals/NowTradingPickerModal";
import { NowTradingCopyTradeModal } from "@/components/modals/NowTradingCopyTradeModal";
import { Button } from "@/components/ui/button";

export function NowTradingView({
  onOpenSpot,
  selected,
  onToggle,
  onRemove,
  max,
}: {
  onOpenSpot: (id: string) => void;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  max: number;
}) {
  const { state } = useStore();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [copySelected, setCopySelected] = useState<Set<string>>(new Set());
  const [copyModalOpen, setCopyModalOpen] = useState(false);
  const ids = Array.from(selected);

  const hasCapitalLimit = state.capitalLimit > 0;
  const investedOpacity = hasCapitalLimit
    ? 0.35 + 0.65 * Math.min(1, computeTopStats(state).deployed / state.capitalLimit)
    : 0;

  // Group by batch/client so same-batch accounts always sit next to each
  // other, regardless of the order they were picked in. Sorted by cluster
  // then account number for stable, predictable placement.
  const byCluster = new Map<number, string[]>();
  for (const id of ids) {
    const c = clusterOf(id);
    if (!byCluster.has(c)) byCluster.set(c, []);
    byCluster.get(c)!.push(id);
  }
  const groups = Array.from(byCluster.entries())
    .sort((x, y) => x[0] - y[0])
    .map(([c, groupIds]) => ({
      cluster: c,
      name: state.names?.[c] ?? "C" + c,
      color: colorOf(state, c),
      ids: groupIds.sort((x, y) => parseInt(x.split("-")[1], 10) - parseInt(y.split("-")[1], 10)),
    }));

  const toggleCopySelect = (id: string) => {
    setCopySelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // You check exactly which accounts to copy trade yourself — no automatic
  // grouping. Valid whenever 2+ checked accounts share the same cluster and
  // the same day (same rule as everywhere else); otherwise the trigger just
  // stays disabled, no popup.
  const copyIds = Array.from(copySelected);
  const copyDay = copyIds.length ? state.spots[copyIds[0]]?.day ?? 0 : 0;
  const copyValid =
    copyIds.length >= 2 &&
    copyDay >= 1 &&
    copyIds.every((id) => clusterOf(id) === clusterOf(copyIds[0]) && (state.spots[id]?.day ?? 0) === copyDay);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Now Trading</h1>
          <p className="text-sm text-dim">
            Your active working set — {ids.length}/{max} accounts. Quick-log outcomes without leaving this view.
            Stays here even if you switch tabs — press × to clear an account. Tick accounts to copy trade them
            together.
          </p>
        </div>
        <Button size="sm" onClick={() => setPickerOpen(true)}>
          {ids.length === 0 ? "Add accounts" : "Manage accounts"}
        </Button>
      </div>

      {ids.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-line bg-panel py-24 text-center">
          <p className="text-sm text-dim">Nothing in your working set yet.</p>
          <p className="font-mono text-data-xs text-faint">Tap "Add accounts" to pick up to {max}.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((g) => (
            <div key={g.cluster}>
              <div className="mb-2 flex items-center gap-1.5 font-mono text-data-xs font-bold uppercase tracking-[0.08em] text-dim">
                <span className="h-[9px] w-[9px] shrink-0 rounded-[2px]" style={{ background: g.color }} />
                {g.name}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.ids.map((id) => (
                  <NowTradingCard
                    key={id}
                    id={id}
                    onOpen={onOpenSpot}
                    onRemove={onRemove}
                    hasCapitalLimit={hasCapitalLimit}
                    investedOpacity={investedOpacity}
                    copySelected={copySelected.has(id)}
                    onToggleCopySelect={toggleCopySelect}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {copyIds.length > 0 && (
        <div className="sticky bottom-4 z-40 flex justify-center">
          <div className="flex items-center gap-3 rounded-2xl border border-line2 bg-panel2 px-4 py-3 shadow-cardHover">
            <span className="font-mono text-[0.7rem] font-bold text-ink">{copyIds.length} checked</span>
            {copyValid ? (
              <Button size="sm" onClick={() => setCopyModalOpen(true)}>
                Copy trade
              </Button>
            ) : (
              <span className="font-mono text-[0.62rem] text-faint">need 2+, same client &amp; day</span>
            )}
            <Button size="sm" variant="ghost" onClick={() => setCopySelected(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      <NowTradingPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        selected={selected}
        onToggle={onToggle}
        max={max}
      />

      <NowTradingCopyTradeModal
        open={copyModalOpen}
        ids={copyIds}
        day={copyDay}
        onClose={() => {
          setCopyModalOpen(false);
          setCopySelected(new Set());
        }}
      />
    </div>
  );
}
