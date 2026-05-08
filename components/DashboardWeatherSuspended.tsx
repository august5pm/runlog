import { Suspense, cache } from "react";
import { DashboardWeather } from "@/components/DashboardWeather";
import { getWeatherSnapshot } from "@/lib/kma-weather";

/** 동일 RSC 요청에서 날씨 조회 1회만(헤더·모바일 슬롯 공유) */
const getWeatherSnapshotCached = cache(getWeatherSnapshot);

export function DashboardWeatherSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg border border-border bg-surface px-3 py-2.5 shadow-card ${className ?? ""}`}
      aria-hidden
    >
      <div className="flex gap-2">
        <div className="h-9 w-9 shrink-0 rounded-full bg-border sm:h-10 sm:w-10" />
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <div className="h-6 w-16 rounded bg-border" />
          <div className="h-3 w-28 rounded bg-border" />
        </div>
      </div>
    </div>
  );
}

async function DashboardWeatherHeaderInner() {
  const data = await getWeatherSnapshotCached();
  return (
    <div className="hidden shrink-0 sm:block sm:max-w-[min(100%,16rem)] sm:pt-0.5">
      <DashboardWeather data={data} />
    </div>
  );
}

async function DashboardWeatherMobileInner() {
  const data = await getWeatherSnapshotCached();
  return (
    <div className="min-w-0 sm:hidden">
      <DashboardWeather data={data} />
    </div>
  );
}

export function DashboardWeatherHeaderSuspended() {
  return (
    <Suspense
      fallback={
        <DashboardWeatherSkeleton className="hidden shrink-0 sm:block sm:max-w-[min(100%,16rem)] sm:pt-0.5" />
      }
    >
      <DashboardWeatherHeaderInner />
    </Suspense>
  );
}

export function DashboardWeatherMobileSuspended() {
  return (
    <Suspense
      fallback={<DashboardWeatherSkeleton className="min-w-0 sm:hidden" />}
    >
      <DashboardWeatherMobileInner />
    </Suspense>
  );
}
