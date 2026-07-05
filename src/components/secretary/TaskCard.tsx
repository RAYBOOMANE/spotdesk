import { useState } from "react";
import { useStore } from "@/store/StoreProvider";
import { useDialogs } from "@/components/ConfirmProvider";
import { taskProgress } from "@/lib/logic";
import type { Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ProgressBar";

const STATUS_LABEL: Record<TaskStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function stepCompleted(s: Task["steps"][number]): boolean {
  return s.qtyTarget != null && s.qtyTarget > 0 ? (s.qtyDone || 0) >= s.qtyTarget : s.completed;
}

function AddStepRow({ taskId, onDone }: { taskId: string; onDone: () => void }) {
  const store = useStore();
  const [title, setTitle] = useState("");
  const [qty, setQty] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    const qtyTarget = qty.trim() ? parseFloat(qty) : undefined;
    store.addStep(taskId, {
      title: title.trim(),
      completed: false,
      qtyTarget: qtyTarget && qtyTarget > 0 ? qtyTarget : undefined,
      qtyDone: qtyTarget && qtyTarget > 0 ? 0 : undefined,
    });
    setTitle("");
    setQty("");
    onDone();
  };

  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <Input
        value={title}
        placeholder="Step title"
        className="py-1.5 text-[0.72rem]"
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        autoFocus
      />
      <Input
        value={qty}
        inputMode="decimal"
        placeholder="qty (optional)"
        className="w-24 py-1.5 text-[0.72rem]"
        onChange={(e) => setQty(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      <button
        onClick={submit}
        className="shrink-0 rounded-lg border border-line2 bg-panel2 px-2.5 py-1.5 text-[0.64rem] font-bold text-ink"
      >
        Add
      </button>
      <button onClick={onDone} className="shrink-0 rounded-lg border border-line px-2.5 py-1.5 text-[0.64rem] font-bold text-dim">
        ✕
      </button>
    </div>
  );
}

export function TaskCard({ task }: { task: Task }) {
  const store = useStore();
  const dialogs = useDialogs();
  const [stepsOpen, setStepsOpen] = useState(false);
  const [addingStep, setAddingStep] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [pinValue, setPinValue] = useState(String(task.progressPercent));

  const pct = task.steps.length > 0 && task.progressMode === "auto" ? taskProgress(task) : task.progressPercent;
  const overdue = !!task.deadline && task.deadline < todayIso() && task.status !== "completed";
  const critical = task.urgency === "high" && task.importance === "high";
  const doneCount = task.steps.filter(stepCompleted).length;

  const remove = async () => {
    const ok = await dialogs.confirm(`Delete task "${task.title}"?`, { confirmLabel: "Delete task", danger: true });
    if (ok) store.deleteTask(task.id);
  };

  const commitPin = () => {
    const n = parseFloat(pinValue);
    if (!isNaN(n)) store.setTaskProgressManual(task.id, n);
    setPinning(false);
  };

  return (
    <div className="rounded-lg border border-line bg-panel2 px-3.5 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn("font-semibold text-ink", task.status === "completed" && "text-dim line-through")}>
              {task.title}
            </span>
            {critical && (
              <Badge className="bg-loss/15 text-loss" color="var(--loss)">
                Critical
              </Badge>
            )}
          </div>
          {task.notes && <p className="mt-0.5 line-clamp-2 font-mono text-data-xs text-dim">{task.notes}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-data-xs">
            <span className={cn(overdue ? "font-bold text-loss" : "text-faint")}>
              {task.deadline ? (overdue ? `overdue · ${task.deadline}` : `due ${task.deadline}`) : "no deadline"}
            </span>
            <span className="text-faint">·</span>
            <span className="text-dim">{STATUS_LABEL[task.status]}</span>
          </div>
        </div>
        <button
          onClick={remove}
          className="shrink-0 rounded p-1 text-faint transition-colors hover:bg-panel hover:text-loss"
          title="delete task"
        >
          ✕
        </button>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <ProgressBar percent={pct} className="flex-1" />
        {pinning ? (
          <Input
            value={pinValue}
            inputMode="decimal"
            className="w-14 py-1 text-center text-[0.68rem]"
            onChange={(e) => setPinValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && commitPin()}
            onBlur={commitPin}
            autoFocus
          />
        ) : (
          <button
            onClick={() => {
              setPinValue(String(pct));
              setPinning(true);
            }}
            className="w-10 shrink-0 text-right font-mono text-data-xs font-bold text-ink"
            title="click to set manually"
          >
            {pct}%
          </button>
        )}
      </div>

      {task.steps.length > 0 && (
        <div className="mt-1.5 flex items-center justify-between">
          <button onClick={() => setStepsOpen((o) => !o)} className="font-mono text-data-xs text-dim hover:text-ink">
            {stepsOpen ? "▾" : "▸"} {doneCount}/{task.steps.length} steps
          </button>
          {task.progressMode === "manual" && (
            <button
              onClick={() => store.resetTaskProgressToAuto(task.id)}
              className="font-mono text-data-xs text-dim hover:text-ink"
            >
              pinned — reset to auto
            </button>
          )}
        </div>
      )}

      {(stepsOpen || task.steps.length === 0) && (
        <div className="mt-1.5 flex flex-col gap-1.5 border-t border-line pt-2">
          {task.steps.map((s) => (
            <div key={s.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={stepCompleted(s)}
                onChange={() => store.toggleStep(task.id, s.id)}
                className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-ink"
              />
              <span className={cn("flex-1 font-mono text-data-xs", stepCompleted(s) ? "text-faint line-through" : "text-ink")}>
                {s.title}
              </span>
              {s.qtyTarget != null && (
                <div className="flex shrink-0 items-center gap-1 font-mono text-data-xs text-dim">
                  <input
                    type="number"
                    value={s.qtyDone || 0}
                    min={0}
                    max={s.qtyTarget}
                    onChange={(e) => store.updateStep(task.id, s.id, { qtyDone: parseFloat(e.target.value) || 0 })}
                    className="w-10 rounded border border-line bg-panel px-1 py-0.5 text-center text-ink focus:border-line2 focus:outline-none"
                  />
                  <span>/ {s.qtyTarget}</span>
                </div>
              )}
              <button
                onClick={() => store.deleteStep(task.id, s.id)}
                className="shrink-0 text-faint transition-colors hover:text-loss"
              >
                ✕
              </button>
            </div>
          ))}

          {addingStep ? (
            <AddStepRow taskId={task.id} onDone={() => setAddingStep(false)} />
          ) : (
            <button
              onClick={() => setAddingStep(true)}
              className="mt-0.5 text-left font-mono text-data-xs text-dim hover:text-ink"
            >
              + Add step
            </button>
          )}
        </div>
      )}
    </div>
  );
}
