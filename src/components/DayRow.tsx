import { cn } from "@/lib/utils";

export function DayRow({ value, onChange }: { value: number; onChange: (d: number) => void }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {Array.from({ length: 14 }, (_, i) => i + 1).map((d) => {
        const sel = d === value;
        return (
          <button
            key={d}
            onClick={() => onChange(d)}
            className={cn(
              "w-[calc(14.28%-6px)] rounded-md border py-1.5 text-center font-mono text-[0.66rem] transition-colors",
              sel
                ? "border-ink bg-ink font-bold text-void"
                : "border-line bg-panel text-dim hover:border-line2 hover:text-ink"
            )}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}
