import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { useStore } from "@/store/StoreProvider";
import { useDialogs } from "./ConfirmProvider";
import { importFromText } from "@/lib/backup";
import { isTauri } from "@/lib/dataService/platform";
import { getBackupService } from "@/lib/dataService";
import { computeTopStats } from "@/lib/stats";

export function FooterActions() {
  const store = useStore();
  const dialogs = useDialogs();
  const fileRef = useRef<HTMLInputElement>(null);

  const newDay = async () => {
    const s = computeTopStats(store.state);
    const ok = await dialogs.confirm(
      `End Day ${store.state.dayCount}?\n\nBanks today's total (+$${(
        store.state.todayProfit + store.state.todayPayouts
      ).toLocaleString()}), folds extra investment into each account's cost, and advances ONLY the ${
        (store.state.tradedToday || []).length
      } accounts traded today (+1 day). ${s.leftToTrade} occupied accounts were NOT traded and will stay on their day.\n\nAn automatic JSON backup will be written.`,
      { confirmLabel: "End day & advance" }
    );
    if (!ok) return;
    await store.rollDay();
  };

  const doExport = async () => {
    const path = await getBackupService().exportBackup(store.state);
    if (path) await dialogs.alert(`Backup saved:\n${path}`);
  };

  const doImport = async () => {
    if (isTauri) {
      try {
        const st = await getBackupService().importBackupViaDialog();
        if (!st) return;
        const ok = await dialogs.confirm(
          `Import backup?\n\nDay ${st.dayCount}, ${Object.values(st.spots).filter((s) => s.day >= 1).length} live accounts, ${
            st.history.length
          } banked days.\n\nThis REPLACES everything currently in the app.`,
          { confirmLabel: "Import & replace", danger: true }
        );
        if (ok) store.importState(st);
      } catch (e: any) {
        await dialogs.alert("Import failed: " + (e?.message ?? e));
      }
    } else {
      fileRef.current?.click();
    }
  };

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const st = importFromText(await f.text());
      const ok = await dialogs.confirm(
        `Import "${f.name}"?\n\nDay ${st.dayCount}, ${Object.values(st.spots).filter((s) => s.day >= 1).length} live accounts, ${
          st.history.length
        } banked days.\n\nThis REPLACES everything currently in the app.`,
        { confirmLabel: "Import & replace", danger: true }
      );
      if (ok) store.importState(st);
    } catch (err: any) {
      await dialogs.alert("Import failed: " + (err?.message ?? err));
    }
  };

  const reset = async () => {
    const ok = await dialogs.confirm(
      "Reset EVERYTHING?\n\nAll spots, history, names and settings will be wiped. Export a backup first if unsure.",
      { confirmLabel: "Wipe everything", danger: true }
    );
    if (!ok) return;
    const really = await dialogs.confirm("Last chance — this cannot be undone.", {
      confirmLabel: "Yes, reset all",
      danger: true,
    });
    if (really) store.resetAll();
  };

  return (
    <div className="mt-10 flex flex-wrap items-center gap-2.5 border-t border-line2 pt-6">
      <Button onClick={newDay}>▶ New Day (bank & advance)</Button>
      <Button variant="outline" onClick={doExport}>
        ⤓ Export backup (.json)
      </Button>
      <Button variant="outline" onClick={doImport}>
        ⤒ Import backup
      </Button>
      <span className="flex-1" />
      <Button variant="danger" size="sm" onClick={reset}>
        Reset all
      </Button>
      <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
    </div>
  );
}
