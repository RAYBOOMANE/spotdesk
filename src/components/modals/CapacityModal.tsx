import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/StoreProvider";
import { N_CLUSTERS, ACCTS_PER_CLUSTER } from "@/lib/ladder";

export function CapacityModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useStore();
  const { state } = store;
  const [cc, setCc] = useState(String(state.capClusters ?? N_CLUSTERS));
  const [ca, setCa] = useState(String(state.capAccts ?? ACCTS_PER_CLUSTER));
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    setCc(String(state.capClusters ?? N_CLUSTERS));
    setCa(String(state.capAccts ?? ACCTS_PER_CLUSTER));
    const n: Record<string, string> = {};
    const count = state.capClusters && state.capClusters > 0 ? state.capClusters : N_CLUSTERS;
    for (let c = 1; c <= count; c++) n[c] = state.names?.[c] ?? "C" + c;
    setNames(n);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const ccN = Math.max(1, Math.min(60, parseInt(cc, 10) || N_CLUSTERS));

  // keep name inputs in sync with cluster count typed
  useEffect(() => {
    setNames((prev) => {
      const next: Record<string, string> = {};
      for (let c = 1; c <= ccN; c++) next[c] = prev[c] ?? state.names?.[c] ?? "C" + c;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ccN]);

  const save = () => {
    const caN = Math.max(1, Math.min(20, parseInt(ca, 10) || ACCTS_PER_CLUSTER));
    store.saveCapacity(ccN, caN, names);
    onClose();
  };
  const clear = () => {
    store.clearCapacity();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-[480px]">
        <DialogTitle>Capacity & clusters</DialogTitle>
        <DialogDescription>
          Set your real capacity (grid size) and name each cluster. Capacity % = live spots ÷ (clusters ×
          accounts).
        </DialogDescription>

        <div className="mb-4 grid grid-cols-2 gap-2.5">
          <div>
            <Label>Clusters</Label>
            <Input inputMode="numeric" value={cc} onChange={(e) => setCc(e.target.value)} />
          </div>
          <div>
            <Label>Accounts per cluster</Label>
            <Input inputMode="numeric" value={ca} onChange={(e) => setCa(e.target.value)} />
          </div>
        </div>

        <Label>Cluster names</Label>
        <div className="mb-4 grid max-h-[260px] grid-cols-2 gap-1.5 overflow-y-auto pr-1">
          {Array.from({ length: ccN }, (_, i) => i + 1).map((c) => (
            <div key={c} className="flex items-center gap-1.5">
              <span className="w-7 shrink-0 text-right font-mono text-[0.58rem] text-faint">{c}</span>
              <Input
                className="px-2 py-1.5 text-[0.72rem]"
                value={names[c] ?? ""}
                placeholder={"C" + c}
                onChange={(e) => setNames({ ...names, [c]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="set" onClick={save}>
            Save capacity
          </Button>
          <Button variant="ghost" onClick={clear}>
            Clear (back to 17×5)
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
