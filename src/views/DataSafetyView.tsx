import { useEffect, useRef, useState } from "react";
import { useStore } from "@/store/StoreProvider";
import { useDialogs } from "@/components/ConfirmProvider";
import { isTauri } from "@/lib/dataService/platform";
import { getBackupService, type SnapshotMeta } from "@/lib/dataService";
import { importFromText } from "@/lib/backup";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DataSafetyView() {
  const store = useStore();
  const dialogs = useDialogs();
  const fileRef = useRef<HTMLInputElement>(null);
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [loadingSnaps, setLoadingSnaps] = useState(true);

  const refreshSnapshots = async () => {
    setLoadingSnaps(true);
    const list = await store.listSnapshots();
    setSnapshots(list);
    setLoadingSnaps(false);
  };

  useEffect(() => {
    void refreshSnapshots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const liveCount = (st: typeof store.state) => Object.values(st.spots).filter((s) => s.day >= 1).length;

  const doExport = async () => {
    const path = await getBackupService().exportBackup(store.state);
    if (path) await dialogs.alert(`Backup saved:\n${path}`);
  };

  const confirmAndImport = async (st: Parameters<typeof store.importState>[0], sourceLabel: string) => {
    const ok = await dialogs.confirm(
      `Import ${sourceLabel}?\n\nDay ${st.dayCount}, ${liveCount(st)} live accounts, ${st.history.length} banked days.\n\nThis REPLACES everything currently in the app — a restore point of the current state is taken first automatically.`,
      { confirmLabel: "Import & replace", danger: true }
    );
    if (!ok) return;
    store.importState(st);
    setTimeout(() => void refreshSnapshots(), 500);
  };

  const doImport = async () => {
    if (isTauri) {
      try {
        const st = await getBackupService().importBackupViaDialog();
        if (!st) return;
        await confirmAndImport(st, "backup");
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
      await confirmAndImport(st, `"${f.name}"`);
    } catch (err: any) {
      await dialogs.alert("Import failed: " + (err?.message ?? err));
    }
  };

  const createRestorePoint = async () => {
    const reason = await dialogs.prompt("Label for this restore point", "", "e.g. before trying something risky");
    if (reason === null) return;
    await store.createRestorePoint(reason.trim() || `manual-${new Date().toISOString()}`);
    await refreshSnapshots();
    await dialogs.alert("Restore point created.");
  };

  const restore = async (snap: SnapshotMeta) => {
    const ok = await dialogs.confirm(
      `Restore to "${snap.label}" (${new Date(snap.createdAt).toLocaleString()})?\n\nThis REPLACES everything currently in the app. A safety restore point of the CURRENT state is taken first, so this itself can be undone.`,
      { confirmLabel: "Restore this point", danger: true }
    );
    if (!ok) return;
    await store.restoreFromSnapshot(snap.id);
    await refreshSnapshots();
  };

  const lastSnapshot = snapshots[0];
  const saved = store.saveStatus;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Data Safety</h1>
        <p className="text-sm text-dim">Backups, restore points, and what to do before/after updating the app.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="px-4 py-4">
          <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">
            Storage backend
          </div>
          <div className="font-mono text-data-lg font-bold text-ink">{isTauri ? "SQLite" : "Browser storage"}</div>
          <div className="mt-1 font-mono text-data-xs text-faint">
            {isTauri ? "desktop app data folder" : "dev fallback only"}
          </div>
        </Card>
        <Card className="px-4 py-4">
          <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">
            Last saved
          </div>
          <div className={cn("font-mono text-data-lg font-bold", saved.ok === false ? "text-loss" : "text-profit")}>
            {saved.ok === null ? "—" : saved.ok ? saved.time : "FAILED"}
          </div>
          <div className="mt-1 font-mono text-data-xs text-faint">
            {saved.ok === false ? "export a backup now" : "autosave + immediate flush on critical actions"}
          </div>
        </Card>
        <Card className="px-4 py-4">
          <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">
            Last restore point
          </div>
          <div className="truncate font-mono text-data-sm font-bold text-ink">
            {isTauri ? (lastSnapshot ? lastSnapshot.label : "none yet") : "n/a"}
          </div>
          <div className="mt-1 font-mono text-data-xs text-faint">
            {isTauri
              ? lastSnapshot
                ? new Date(lastSnapshot.createdAt).toLocaleString()
                : "created automatically before risky actions"
              : "desktop app only"}
          </div>
        </Card>
        <Card className="px-4 py-4">
          <div className="mb-1.5 font-mono text-micro font-medium uppercase tracking-[0.12em] text-dim">
            Restore points kept
          </div>
          <div className="font-mono text-data-lg font-bold text-ink">{isTauri ? snapshots.length : "—"}</div>
          <div className="mt-1 font-mono text-data-xs text-faint">last 20 shown, 60 kept</div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">
          Backup actions
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button onClick={doExport}>⤓ Export backup (.json)</Button>
          <Button variant="outline" onClick={doImport}>
            ⤒ Import backup
          </Button>
          <Button variant="outline" onClick={createRestorePoint} disabled={!isTauri}>
            + Create restore point
          </Button>
        </div>
        {!isTauri && (
          <p className="mt-3 font-mono text-data-xs text-faint">
            Restore points need the desktop app's SQLite storage — not available in this browser preview.
          </p>
        )}
        <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
      </Card>

      <Card className="p-5">
        <div className="mb-4 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">
          Recent restore points{isTauri && ` (${snapshots.length})`}
        </div>
        {!isTauri ? (
          <p className="font-mono text-data-xs text-faint">Not available in this browser preview — desktop app only.</p>
        ) : loadingSnaps ? (
          <p className="font-mono text-data-xs text-faint">Loading…</p>
        ) : snapshots.length === 0 ? (
          <p className="font-mono text-data-xs text-faint">
            None yet — one is taken automatically before New Day, import, and reset.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {snapshots.map((snap) => (
              <div
                key={snap.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-line bg-panel2 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <div className="truncate font-mono text-data-xs font-bold text-ink">{snap.label}</div>
                  <div className="font-mono text-data-xs text-faint">{new Date(snap.createdAt).toLocaleString()}</div>
                </div>
                <button
                  onClick={() => restore(snap)}
                  className="shrink-0 rounded-lg border border-loss/40 px-2.5 py-1 text-[0.62rem] font-bold text-loss transition-colors hover:bg-loss/10"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-5">
        <div className="mb-4 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">
          Before/after updating SPOTDESK
        </div>
        <ul className="flex flex-col gap-2 font-mono text-data-xs text-dim">
          <li>1. Export a backup (.json) before installing any app update.</li>
          <li>2. After updating, open the app and confirm your data is still there, then export a fresh backup to confirm export still works.</li>
          <li>
            3. GitHub / the app update only saves the CODE. A JSON export is the only thing that saves your BUSINESS
            DATA (spots, history, clients, tasks). One does not substitute for the other.
          </li>
        </ul>
      </Card>
    </div>
  );
}
