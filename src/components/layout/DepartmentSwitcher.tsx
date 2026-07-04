import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { DEPARTMENTS, type Department } from "@/config/departments";
import { cn } from "@/lib/utils";

// Pinned above the sidebar's tab list — reopens the department picker without
// leaving the sidebar shell (confirmed approach from the migration plan).
export function DepartmentSwitcher({
  active,
  onSelect,
}: {
  active: Department;
  onSelect: (d: Department) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = DEPARTMENTS.find((d) => d.key === active) ?? DEPARTMENTS[0];

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={ref} className="relative mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 rounded-lg border border-line bg-panel2 px-3 py-2 transition-colors hover:border-line2"
      >
        <current.icon className="h-4 w-4 shrink-0 text-ink" />
        <span className="flex-1 truncate text-left font-mono text-data-xs font-bold uppercase tracking-[0.1em] text-ink">
          {current.label}
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-faint" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-faint" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-10 overflow-hidden rounded-lg border border-line2 bg-panel2 shadow-cardHover">
          {DEPARTMENTS.map((d) => (
            <button
              key={d.key}
              onClick={() => {
                onSelect(d.key);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-left text-[0.72rem] transition-colors",
                d.key === active ? "bg-panel text-ink" : "text-dim hover:bg-panel hover:text-ink"
              )}
            >
              <d.icon className="h-3.5 w-3.5 shrink-0" />
              {d.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
