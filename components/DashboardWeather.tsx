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
      className={`flex min-h-0 flex-col items-end rounded-lg border border-border bg-surface px-2.5 py-1.5 shadow-card transition hover:border-accent sm:px-3 sm:py-2.5 ${className}`}
    >
      {data.ok ? (
        <>
          <div className="flex w-full flex-row items-center gap-2 sm:gap-2.5">
            <WeatherIcon
              kind={data.iconKind}
              title={weatherIconKindLabel(data.iconKind)}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center text-3xl leading-none select-none"
            />
            <div className="min-w-0 flex-1 text-left sm:flex-none">
              <p className="font-numeric text-xl font-bold tabular-nums leading-none text-foreground sm:text-2xl">
                {data.tempC}
                <span className="ml-0.5 text-base font-semibold text-muted sm:text-lg">
                  °C
                </span>
              </p>
              <p className="mt-0 text-[10px] leading-tight text-muted sm:mt-0.5 sm:text-[11px] sm:leading-snug">
                {data.humidity != null ? (
                  <span>습도 {data.humidity}% · </span>
                ) : null}
                <span>{data.precipLabel}</span>
              </p>
              <span className="mt-0.5 block text-[10px] font-medium leading-tight text-accent sm:hidden">
                네이버 날씨 →
              </span>
            </div>
          </div>
          <span className="mt-1.5 hidden w-full text-right text-[10px] font-medium leading-tight text-accent sm:block sm:text-[11px] sm:leading-snug">
            네이버 날씨 →
          </span>
        </>
      ) : (
        <>
          <p className="max-w-[14rem] text-[11px] leading-snug text-muted">
            {data.message}
          </p>
          <span className="mt-1.5 block w-full text-left text-[10px] font-medium leading-tight text-accent sm:text-right sm:text-[11px] sm:leading-snug">
            네이버 날씨 →
          </span>
        </>
      )}
    </a>
  );
}
