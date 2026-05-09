import type { WeatherSnapshot } from "@/lib/kma-weather";
import { weatherIconKindLabel } from "@/lib/weather-icon-map";
import { WeatherIcon } from "@/components/WeatherIcon";

export function DashboardWeather({
  data,
  className = "",
}: {
  data: WeatherSnapshot;
  className?: string;
}) {
  return (
    <a
      href={data.naverWeatherUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex h-full min-h-0 flex-col items-end rounded-lg border border-border bg-surface px-3 py-2.5 shadow-card transition hover:border-accent ${className}`}
    >
      {data.ok ? (
        <>
          <div className="flex w-full flex-row items-center gap-2.5">
            <WeatherIcon
              kind={data.iconKind}
              title={weatherIconKindLabel(data.iconKind)}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-4xl leading-none select-none sm:h-10 sm:w-10 sm:text-3xl"
            />
            <div className="min-w-0 flex-1 text-left sm:flex-none">
              <p className="font-numeric text-2xl font-bold tabular-nums leading-none text-foreground">
                {data.tempC}
                <span className="ml-0.5 text-lg font-semibold text-muted">°C</span>
              </p>
              <p className="mt-0.5 text-[11px] leading-snug text-muted">
                {data.humidity != null ? (
                  <span>습도 {data.humidity}% · </span>
                ) : null}
                <span>{data.precipLabel}</span>
              </p>
              <span className="mt-1.5 block text-[10px] font-medium text-accent sm:hidden">
                네이버 날씨 →
              </span>
            </div>
          </div>
          <span className="mt-1.5 hidden w-full text-right text-[10px] font-medium text-accent sm:block">
            네이버 날씨 →
          </span>
        </>
      ) : (
        <>
          <p className="max-w-[14rem] text-[11px] leading-snug text-muted">
            {data.message}
          </p>
          <span className="mt-1.5 block w-full text-left text-[10px] font-medium text-accent sm:text-right">
            네이버 날씨 →
          </span>
        </>
      )}
    </a>
  );
}
