import { cn } from "@/lib/utils";

// Sleek, compact linear bar. Monochrome ink fill by default; green only at
// 100% (success), matching the app-wide rule that color carries meaning,
// not decoration.
export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, percent));
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-panel2", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-300 ease-out", pct >= 100 ? "bg-profit" : "bg-ink")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
