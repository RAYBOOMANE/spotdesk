import type { ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface CircularNavItem<T extends string> {
  key: T;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

// A stylish-but-institutional circular launcher: N nodes evenly spaced around a
// ring, positioned with trig (not a new UI paradigm to navigate — just geometry).
// DOM order stays a plain top-to-bottom list of <button>s so Tab order and screen
// readers see a normal menu; only the CSS position is circular.
export function CircularNav<T extends string>({
  items,
  onSelect,
  center,
  radius = 140,
  nodeSize = 96,
}: {
  items: CircularNavItem<T>[];
  onSelect: (key: T) => void;
  center?: ReactNode;
  radius?: number;
  nodeSize?: number;
}) {
  const size = radius * 2 + nodeSize;
  const mid = size / 2;
  const hubSize = nodeSize * 0.9;

  return (
    <div
      className="relative mx-auto animate-in fade-in zoom-in-95 duration-500"
      style={{ width: size, height: size }}
    >
      <svg className="absolute inset-0" width={size} height={size}>
        <circle cx={mid} cy={mid} r={radius} fill="none" stroke="var(--line)" strokeWidth={1} />
      </svg>

      {center && (
        <div
          className="absolute flex flex-col items-center justify-center rounded-full border border-line2 bg-panel2 text-center"
          style={{ width: hubSize, height: hubSize, left: mid - hubSize / 2, top: mid - hubSize / 2 }}
        >
          {center}
        </div>
      )}

      <ul>
        {items.map(({ key, label, icon: Icon }, i) => {
          const angle = (2 * Math.PI * i) / items.length - Math.PI / 2;
          const cx = mid + radius * Math.cos(angle) - nodeSize / 2;
          const cy = mid + radius * Math.sin(angle) - nodeSize / 2;
          return (
            <li key={key} className="absolute" style={{ left: cx, top: cy, width: nodeSize, height: nodeSize }}>
              <button
                onClick={() => onSelect(key)}
                style={{ animationDelay: `${i * 50}ms` }}
                className={cn(
                  "flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-full border border-line bg-panel text-dim",
                  "transition-colors hover:border-line2 hover:bg-panel2 hover:text-ink",
                  "animate-in fade-in zoom-in-95 duration-300"
                )}
              >
                <Icon className="h-[22px] w-[22px]" />
                <span className="text-[0.72rem] font-medium">{label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
