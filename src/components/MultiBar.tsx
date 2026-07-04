import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function MultiBar({
  count,
  onLog,
  onClear,
}: {
  count: number;
  onLog: () => void;
  onClear: () => void;
}) {
  return (
    <div
      className={cn(
        "fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2.5 rounded-xl border border-live bg-panel px-3.5 py-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] transition-transform",
        count > 0 ? "translate-y-0" : "translate-y-[150%]"
      )}
    >
      <span className="font-mono text-[0.7rem] font-bold text-live">{count} selected</span>
      <Button size="sm" onClick={onLog}>
        Log selected together
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
