import { Button } from "@/components/ui/button";

export function MultiBar({
  count,
  onLog,
  onClear,
}: {
  count: number;
  onLog: () => void;
  onClear: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="sticky bottom-4 z-40 flex justify-center">
      <div className="flex items-center gap-3 rounded-2xl border border-line2 bg-panel2 px-4 py-3 shadow-cardHover">
        <span className="font-mono text-[0.7rem] font-bold text-ink">{count} selected</span>
        <Button size="sm" onClick={onLog}>
          Log selected together
        </Button>
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </div>
    </div>
  );
}
