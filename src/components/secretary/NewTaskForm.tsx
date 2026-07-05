import { useState } from "react";
import { useStore } from "@/store/StoreProvider";
import { cn } from "@/lib/utils";
import type { TaskLevel } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const LEVELS: TaskLevel[] = ["low", "medium", "high"];

export function NewTaskForm() {
  const store = useStore();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [urgency, setUrgency] = useState<TaskLevel>("medium");
  const [importance, setImportance] = useState<TaskLevel>("medium");
  const [deadline, setDeadline] = useState("");

  const submit = () => {
    if (!title.trim()) return;
    store.addTask({ title: title.trim(), notes: notes.trim(), urgency, importance, deadline: deadline || undefined });
    setTitle("");
    setNotes("");
    setUrgency("medium");
    setImportance("medium");
    setDeadline("");
  };

  return (
    <Card className="p-4">
      <div className="mb-3 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">New task</div>
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
      <Button className="mt-3" onClick={submit}>
        Add task
      </Button>
    </Card>
  );
}
