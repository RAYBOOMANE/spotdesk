import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useStore } from "@/store/StoreProvider";
import { gridDims, colorOf } from "@/lib/logic";
import { cn } from "@/lib/utils";

export function NowTradingPickerModal({
  open,
  onClose,
  selected,
  onToggle,
  max,
}: {
  open: boolean;
  onClose: () => void;
  selected: Set<string>;
  onToggle: (id: string) => void;
  max: number;
}) {
  const { state } = useStore();
  const { nClusters, nAccts } = gridDims(state);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[560px]">
        <DialogTitle>Add to Now Trading</DialogTitle>
        <DialogDescription>
          Pick up to {max} accounts you're actively trading right now — any client, any day.{" "}
          <b className="text-ink">
            {selected.size}/{max}
          </b>{" "}
          selected.
        </DialogDescription>

        <div className="max-h-[420px] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {Array.from({ length: nClusters }, (_, i) => i + 1).map((c) => {
              const name = state.names?.[c] ?? "C" + c;
              const clientColor = colorOf(state, c);
              return (
                <div key={c} className="rounded-lg border border-line bg-panel p-2">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <span className="h-[8px] w-[8px] shrink-0 rounded-[2px]" style={{ background: clientColor }} />
                    <span className="truncate font-mono text-[0.6rem] font-bold text-dim">{name}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    {Array.from({ length: nAccts }, (_, j) => j + 1).map((a) => {
                      const id = `${c}-${a}`;
                      const sp = state.spots[id] ?? { day: 0, cost: 0, extra: 0 };
                      const occupied = sp.day >= 1;
                      const tied = occupied ? (sp.cost || 0) + (sp.extra || 0) : 0;
                      const isSel = selected.has(id);
                      const disabled = !isSel && selected.size >= max;
                      return (
                        <label
                          key={id}
                          className={cn(
                            "flex items-center gap-1.5 rounded px-1.5 py-1 font-mono text-[0.62rem] transition-colors",
                            disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-panel2"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={isSel}
                            disabled={disabled}
                            onChange={() => onToggle(id)}
                            className="h-3 w-3 shrink-0 cursor-pointer accent-ink disabled:cursor-not-allowed"
                          />
                          <span className="text-dim">A{a}</span>
                          <span className="ml-auto text-faint">
                            {occupied ? (
                              <>
                                D{sp.day} <span className="text-invested">${tied.toLocaleString()}</span>
                              </>
                            ) : (
                              "free"
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
