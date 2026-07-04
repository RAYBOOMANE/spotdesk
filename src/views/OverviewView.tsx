import { HeroMetric } from "@/components/dashboard/HeroMetric";
import { KpiTicker } from "@/components/dashboard/KpiTicker";
import { IntradayPnlChart } from "@/components/dashboard/IntradayPnlChart";
import { EquityCurve } from "@/components/EquityCurve";
import { ZoneDistributionChart } from "@/components/dashboard/ZoneDistributionChart";
import { DeployedCapitalChart } from "@/components/dashboard/DeployedCapitalChart";
import { CapacityGauge } from "@/components/dashboard/CapacityGauge";
import { PayoutsVsBlowsChart } from "@/components/dashboard/PayoutsVsBlowsChart";
import { PackagePerformanceChart } from "@/components/dashboard/PackagePerformanceChart";

export function OverviewView({ onCapacityClick }: { onCapacityClick: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Overview</h1>
        <p className="text-sm text-dim">Live snapshot of today's performance and capacity.</p>
      </div>

      <HeroMetric />
      <KpiTicker />

      {/* Dominant chart */}
      <IntradayPnlChart />

      {/* Supporting analytics */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <EquityCurve />
        <ZoneDistributionChart />
        <DeployedCapitalChart />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CapacityGauge onClick={onCapacityClick} />
        <PayoutsVsBlowsChart />
        <PackagePerformanceChart />
      </div>
    </div>
  );
}
