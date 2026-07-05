import { useState } from "react";
import { useDialogs } from "@/components/ConfirmProvider";

// Trading Floor → Now Trading working set. Deliberately separate from
// useMultiSelect's copy-trade selection: any client/account, any day, no
// same-cluster/same-day rule — just a cap. Session-only for this first pass
// (not persisted to AppState/SQLite yet).
const MAX_NOW_TRADING = 30;

export function useNowTrading() {
  const dialogs = useDialogs();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= MAX_NOW_TRADING) {
        void dialogs.alert(`Now Trading is capped at ${MAX_NOW_TRADING} accounts. Remove one before adding another.`);
        return prev;
      }
      next.add(id);
      return next;
    });
  };

  const remove = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const clear = () => setSelected(new Set());

  return { selected, toggle, remove, clear, max: MAX_NOW_TRADING };
}
