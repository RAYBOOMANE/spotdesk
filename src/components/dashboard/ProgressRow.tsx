export type ProgressStatus = "profit" | "loss" | "neutral" | "capital";

function progressColor(status: ProgressStatus): string {
  if (status === "profit") return "var(--profit)";
  if (status === "loss") return "var(--loss)";
  if (status === "capital") return "var(--invested)";
  return "var(--line2)";
}

// Shared by CEO Office → Objectives and CEO Office → Overview. Green for any
// non-negative progress toward a P&L target (red is reserved for a genuine
// loss, not merely "behind"), orange for capital/allocation-ceiling rows.
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
        <span className="font-mono text-data-xs text-faint">
          {targetLabel}
          {status !== "neutral" && ` · ${Math.round(pct)}%`}
        </span>
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

// Shared target-vs-actual classification: unset target -> neutral. Otherwise
// green for any non-negative progress (still working toward the goal counts
// as "on track", not a warning) and red only for an actual loss.
export function targetStatus(actual: number, target: number): { pct: number; status: "profit" | "loss" | "neutral" } {
  if (!target) return { pct: 0, status: "neutral" };
  return { pct: (actual / target) * 100, status: actual >= 0 ? "profit" : "loss" };
}
