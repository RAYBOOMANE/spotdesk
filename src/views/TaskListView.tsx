import { useMemo } from "react";
import { useStore } from "@/store/StoreProvider";
import { secretaryTasks, type SecretaryFilter } from "@/lib/stats";
import { Card } from "@/components/ui/card";
import { TaskCard } from "@/components/secretary/TaskCard";

export type { SecretaryFilter };

const META: Record<SecretaryFilter, { title: string; description: string }> = {
  today: { title: "Today", description: "Due exactly today — no overdue tasks, no tasks without a deadline." },
  upcoming: { title: "Upcoming", description: "Due later this calendar month." },
  all: { title: "All Tasks", description: "Every task — simple and multi-step." },
  completed: { title: "Completed", description: "Finished tasks." },
};

export function TaskListView({ filter }: { filter: SecretaryFilter }) {
  const { state } = useStore();
  const meta = META[filter];
  const tasks = useMemo(() => secretaryTasks(state, filter), [state, filter]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">{meta.title}</h1>
        <p className="text-sm text-dim">{meta.description}</p>
      </div>

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
