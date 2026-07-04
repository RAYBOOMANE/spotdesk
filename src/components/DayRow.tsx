import { LADDER } from "@/lib/ladder";
import { cn } from "@/lib/utils";

const SEL_BY_ZONE: Record<string, string> = {
  live: "bg-live text-[#04110c] border-live",
  deep: "bg-deepz text-[#1a0408] border-deepz",
  cool: "bg-cool text-[#04101a] border-cool",
  gold: "bg-gold text-[#160f00] border-gold",
};

export function DayRow({ value, onChange }: { value: number; onChange: (d: number) => void }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1.5">
      {Array.from({ length: 14 }, (_, i) => i + 1).map((d) => {
        const L = LADDER[d];
        const sel = d === value;
        return (
          <button
            key={d}
            onClick={() => onChange(d)}
            className={cn(
              "w-[calc(14.28%-6px)] rounded-md border py-1.5 text-center font-mono text-[0.66rem] transition-all",
              sel ? cn("font-bold", SEL_BY_ZONE[L.zone]) : "border-line bg-panel2 text-dim hover:border-line2 hover:text-ink"
            )}
          >
            {d}
          </button>
        );
      })}
    </div>
  );
}
