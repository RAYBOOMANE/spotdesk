import { HeroMetric } from "@/components/dashboard/HeroMetric";
import { KpiTicker } from "@/components/dashboard/KpiTicker";
import { IntradayPnlChart } from "@/components/dashboard/IntradayPnlChart";
import { EquityCurve } from "@/components/EquityCurve";
import { ZoneDistributionChart } from "@/components/dashboard/ZoneDistributionChart";
import { DeployedCapitalChart } from "@/components/dashboard/DeployedCapitalChart";
import { CapacityGauge } from "@/components/dashboard/CapacityGauge";

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <EquityCurve />
        <ZoneDistributionChart />
        <DeployedCapitalChart />
        <CapacityGauge onClick={onCapacityClick} />
      </div>
    </div>
  );
}
