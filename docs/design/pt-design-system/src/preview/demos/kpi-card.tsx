import { KpiCard } from '../../components/ui/kpi-card';

export function KpiCardDemo() {
  return (
    <div className="rounded-xl border bg-background p-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Leads"
          number="42"
          trendValue="2"
          trendSuffix="more than last week"
          trendDir="up"
          trendTone="mint"
        />
        <KpiCard
          label="Active Students"
          number="128"
          trendValue="6%"
          trendSuffix="growth this month"
          trendDir="up"
          trendTone="mint"
        />
        <KpiCard
          label="Unassigned Requests"
          number="7"
          trendValue="3"
          trendSuffix="waiting over 48h"
          trendDir="up"
          trendTone="amber"
        />
        <KpiCard
          label="Cancellations"
          number="4"
          trendValue="12%"
          trendSuffix="down from last week"
          trendDir="down"
          trendTone="rose"
        />
      </div>
    </div>
  );
}
