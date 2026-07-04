import { useState } from "react";
import { useStore } from "@/store/StoreProvider";
import { useDialogs } from "@/components/ConfirmProvider";
import { selectionError } from "@/lib/logic";

export function useMultiSelect() {
  const store = useStore();
  const dialogs = useDialogs();
  const [multiSel, setMultiSel] = useState<Set<string>>(new Set());

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

  const clearSelection = () => setMultiSel(new Set());

  return { multiSel, toggleSelect, clearSelection };
}
