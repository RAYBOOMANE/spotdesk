import { TodayLog } from "@/components/dashboard/TodayLog";

export function LogView() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Log</h1>
        <p className="text-sm text-dim">Every blow and payout recorded today.</p>
      </div>
      <TodayLog />
    </div>
  );
}
