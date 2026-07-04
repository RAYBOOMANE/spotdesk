import { TopStats } from "@/components/dashboard/TopStats";
import { EquityCurve } from "@/components/EquityCurve";
import { ZoneDistributionChart } from "@/components/dashboard/ZoneDistributionChart";
import { PayoutsVsBlowsChart } from "@/components/dashboard/PayoutsVsBlowsChart";
import { PackagePerformanceChart } from "@/components/dashboard/PackagePerformanceChart";

export function OverviewView({ onCapacityClick }: { onCapacityClick: () => void }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Overview</h1>
        <p className="text-sm text-dim">Live snapshot of today's performance and capacity.</p>
      </div>
      <TopStats onCapacityClick={onCapacityClick} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EquityCurve />
        </div>
        <ZoneDistributionChart />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PayoutsVsBlowsChart />
        <PackagePerformanceChart />
      </div>
    </div>
  );
}
