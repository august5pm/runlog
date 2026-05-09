import { Suspense, cache } from "react";
import { DashboardWeather } from "@/components/DashboardWeather";
import { getWeatherSnapshot } from "@/lib/kma-weather";

/** 동일 RSC 요청에서 날씨 조회 1회만 */
const getWeatherSnapshotCached = cache(getWeatherSnapshot);

export function DashboardWeatherSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg border border-border bg-surface px-2.5 py-1.5 shadow-card sm:px-3 sm:py-2.5 ${className ?? ""}`}
      aria-hidden
    >
      <div className="flex flex-row items-center gap-2 sm:gap-2.5">
        <div className="h-10 w-10 shrink-0 rounded-full bg-border" />
        <div className="min-w-0 flex-1 space-y-1 pt-0 sm:space-y-2 sm:pt-0.5">
          <div className="h-5 w-14 rounded bg-border sm:h-6 sm:w-16" />
          <div className="h-2.5 w-24 rounded bg-border sm:h-3 sm:w-28" />
        </div>
      </div>
    </div>
  );
}

async function DashboardWeatherHeaderInner() {
  const data = await getWeatherSnapshotCached();
  return (
    <div className="shrink-0 max-w-[min(100%,16rem)] max-sm:pt-0 sm:pt-0.5">
      <DashboardWeather data={data} />
    </div>
  );
}

export function DashboardWeatherHeaderSuspended() {
  return (
    <Suspense
      fallback={
        <div className="shrink-0 max-w-[min(100%,16rem)] max-sm:pt-0 sm:pt-0.5">
          <DashboardWeatherSkeleton />
        </div>
      }
    >
      <DashboardWeatherHeaderInner />
    </Suspense>
  );
}
