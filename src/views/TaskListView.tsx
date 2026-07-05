import { useMemo } from "react";
import { useStore } from "@/store/StoreProvider";
import type { Task } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { TaskCard } from "@/components/secretary/TaskCard";
import { NewTaskForm } from "@/components/secretary/NewTaskForm";

export type SecretaryFilter = "today" | "upcoming" | "all" | "projects" | "completed";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const META: Record<SecretaryFilter, { title: string; description: string; showForm: boolean }> = {
  today: { title: "Today", description: "Due today, or already overdue.", showForm: true },
  upcoming: { title: "Upcoming", description: "Has a deadline, not due yet.", showForm: true },
  all: { title: "All Tasks", description: "Every task — simple and multi-step.", showForm: true },
  projects: {
    title: "Projects",
    description: "Multi-step tasks — progress derived from completed steps unless pinned.",
    showForm: true,
  },
  completed: { title: "Completed", description: "Finished tasks.", showForm: false },
};

function filterTasks(tasks: Task[], filter: SecretaryFilter): Task[] {
  const today = todayIso();
  switch (filter) {
    case "today":
      return tasks.filter((t) => t.status !== "completed" && !!t.deadline && t.deadline <= today);
    case "upcoming":
      return tasks.filter((t) => t.status !== "completed" && !!t.deadline && t.deadline > today);
    case "projects":
      return tasks.filter((t) => t.steps.length > 0);
    case "completed":
      return tasks.filter((t) => t.status === "completed");
    case "all":
    default:
      return tasks;
  }
}

// Overdue/critical first, then soonest deadline, then newest.
function sortTasks(tasks: Task[]): Task[] {
  const today = todayIso();
  return [...tasks].sort((a, b) => {
    const aOver = !!a.deadline && a.deadline < today && a.status !== "completed";
    const bOver = !!b.deadline && b.deadline < today && b.status !== "completed";
    if (aOver !== bOver) return aOver ? -1 : 1;
    if (a.deadline && b.deadline && a.deadline !== b.deadline) return a.deadline < b.deadline ? -1 : 1;
    if (a.deadline && !b.deadline) return -1;
    if (!a.deadline && b.deadline) return 1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

export function TaskListView({ filter }: { filter: SecretaryFilter }) {
  const { state } = useStore();
  const meta = META[filter];
  const tasks = useMemo(() => sortTasks(filterTasks(state.tasks || [], filter)), [state.tasks, filter]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">{meta.title}</h1>
        <p className="text-sm text-dim">{meta.description}</p>
      </div>

      {meta.showForm && <NewTaskForm />}

      <Card className="p-4">
        <div className="mb-3 font-mono text-micro font-medium uppercase tracking-[0.14em] text-dim">
          {tasks.length} {tasks.length === 1 ? "task" : "tasks"}
        </div>
        {tasks.length === 0 ? (
          <p className="font-mono text-data-xs text-faint">Nothing here.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tasks.map((t) => (
              <TaskCard key={t.id} task={t} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
