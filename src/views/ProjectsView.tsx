import { Card } from "@/components/ui/card";

// Placeholder: the old behavior here (treating any multi-step task as a
// "project") was wrong per spec -- a project is meant to be a GROUP of
// several separate tasks, not a property of one task's steps. That needs a
// small new Project entity (group of task ids), which requires schema
// approval before it's built. Nothing is silently guessed here in the
// meantime.
export function ProjectsView() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Projects</h1>
        <p className="text-sm text-dim">A project groups several tasks together.</p>
      </div>

      <Card className="p-5">
        <p className="font-mono text-data-xs text-faint">
          Not built yet. This needs a small Project entity (a named group referencing several existing tasks) added
          to the data model — pending schema approval before implementation, per instruction. A multi-step task is
          not automatically a project.
        </p>
      </Card>
    </div>
  );
}
