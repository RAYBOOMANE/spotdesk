import { useState } from "react";
import { useStore } from "@/store/StoreProvider";
import { cn } from "@/lib/utils";
import type { TaskLevel } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const LEVELS: TaskLevel[] = ["low", "medium", "high"];

interface DraftStep {
  title: string;
  qtyTarget?: number;
}

// Dedicated creation screen: a task and its steps are built up together
// BEFORE the task exists, then created in one atomic addTask() call --
// no create-then-edit round trip through the task list to add subtasks.
export function NewTaskView() {
  const store = useStore();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [urgency, setUrgency] = useState<TaskLevel>("medium");
  const [importance, setImportance] = useState<TaskLevel>("medium");
  const [deadline, setDeadline] = useState("");
  const [draftSteps, setDraftSteps] = useState<DraftStep[]>([]);
  const [stepTitle, setStepTitle] = useState("");
  const [stepQty, setStepQty] = useState("");
  const [justCreated, setJustCreated] = useState(false);

  const addDraftStep = () => {
    if (!stepTitle.trim()) return;
    const qty = stepQty.trim() ? parseFloat(stepQty) : undefined;
    setDraftSteps((s) => [...s, { title: stepTitle.trim(), qtyTarget: qty && qty > 0 ? qty : undefined }]);
    setStepTitle("");
    setStepQty("");
  };

  const removeDraftStep = (idx: number) => {
    setDraftSteps((s) => s.filter((_, i) => i !== idx));
  };

  const submit = () => {
    if (!title.trim()) return;
    store.addTask({
      title: title.trim(),
      notes: notes.trim(),
      urgency,
      importance,
      deadline: deadline || undefined,
      steps: draftSteps.map((s) => ({
        title: s.title,
        completed: false,
        qtyTarget: s.qtyTarget,
        qtyDone: s.qtyTarget ? 0 : undefined,
      })),
    });
    setTitle("");
    setNotes("");
    setUrgency("medium");
    setImportance("medium");
    setDeadline("");
    setDraftSteps([]);
    setJustCreated(true);
    setTimeout(() => setJustCreated(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">New Task</h1>
        <p className="text-sm text-dim">Create a task and its steps together — steps are optional, add as many as you need.</p>
      </div>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Title</Label>
            <Input
              value={title}
              placeholder="e.g. Buy 4 phones"
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div className="sm:col-span-2">
            <Label>Notes (optional)</Label>
            <Input value={notes} placeholder="Details" onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div>
            <Label>Urgency</Label>
            <div className="flex gap-1.5">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setUrgency(l)}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-1.5 text-[0.64rem] font-bold capitalize transition-colors",
                    urgency === l ? "border-line2 bg-panel2 text-ink" : "border-line text-dim"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label>Importance</Label>
            <div className="flex gap-1.5">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  onClick={() => setImportance(l)}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-1.5 text-[0.64rem] font-bold capitalize transition-colors",
                    importance === l ? "border-line2 bg-panel2 text-ink" : "border-line text-dim"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Label>Deadline (optional)</Label>
            <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">
          Steps / subtasks (optional)
        </div>

        {draftSteps.length > 0 && (
          <div className="mb-3 flex flex-col gap-1.5">
            {draftSteps.map((s, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-line bg-panel px-2.5 py-1.5">
                <span className="flex-1 font-mono text-data-xs text-ink">{s.title}</span>
                {s.qtyTarget != null && <span className="font-mono text-data-xs text-dim">target: {s.qtyTarget}</span>}
                <button onClick={() => removeDraftStep(i)} className="text-faint transition-colors hover:text-loss">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <Input
            value={stepTitle}
            placeholder="Step title"
            className="py-1.5 text-[0.72rem]"
            onChange={(e) => setStepTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDraftStep()}
          />
          <Input
            value={stepQty}
            inputMode="decimal"
            placeholder="qty (optional)"
            className="w-28 py-1.5 text-[0.72rem]"
            onChange={(e) => setStepQty(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addDraftStep()}
          />
          <button
            onClick={addDraftStep}
            className="shrink-0 rounded-lg border border-line2 bg-panel2 px-2.5 py-1.5 text-[0.64rem] font-bold text-ink"
          >
            + Add step
          </button>
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={submit}>Create task</Button>
        {justCreated && <span className="font-mono text-data-xs font-bold text-profit">Task created ✓</span>}
      </div>
    </div>
  );
}
