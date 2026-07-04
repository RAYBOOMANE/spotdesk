import { PnlHistory } from "@/components/dashboard/PnlHistory";

export function HistoryView({ onOpenDay }: { onOpenDay: (idx: number) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">History</h1>
        <p className="text-sm text-dim">Banked days — click a bar to view or edit.</p>
      </div>
      <PnlHistory onOpenDay={onOpenDay} />
    </div>
  );
}
