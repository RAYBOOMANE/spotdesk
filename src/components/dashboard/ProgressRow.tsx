export type ProgressStatus = "ahead" | "behind" | "neutral" | "capital";

function progressColor(status: ProgressStatus): string {
  if (status === "ahead") return "var(--profit)";
  if (status === "behind") return "var(--loss)";
  if (status === "capital") return "var(--invested)";
  return "var(--line2)";
}

// Shared by CEO Office → Objectives and CEO Office → Overview. Green/red for
// P&L-target rows (ahead/behind), orange for capital/allocation-ceiling rows.
export function ProgressRow({
  label,
  actualLabel,
  targetLabel,
  pct,
  status,
}: {
  label: string;
  actualLabel: string;
  targetLabel: string;
  pct: number;
  status: ProgressStatus;
}) {
  const color = progressColor(status);
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="font-mono text-micro font-medium uppercase tracking-[0.1em] text-dim">{label}</span>
        <span className="font-mono text-data-xs text-faint">{targetLabel}</span>
      </div>
      <div className="mb-1 h-[6px] overflow-hidden rounded-[3px] bg-panel2">
        <div
          className="h-full rounded-[3px] transition-all"
          style={{ width: `${Math.max(2, Math.min(100, pct))}%`, background: color }}
        />
      </div>
      <div className="font-mono text-data-sm font-bold" style={{ color: status === "neutral" ? "var(--ink)" : color }}>
        {actualLabel}
      </div>
    </div>
  );
}

// Shared target-vs-actual classification: unset target -> neutral, else
// ahead/behind by comparing actual to target directly (targets assumed >= 0).
export function targetStatus(
  actual: number,
  target: number
): { pct: number; status: "ahead" | "behind" | "neutral" } {
  if (!target) return { pct: 0, status: "neutral" };
  return { pct: (actual / target) * 100, status: actual >= target ? "ahead" : "behind" };
}
