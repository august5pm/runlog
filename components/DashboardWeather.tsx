import type { WeatherSnapshot } from "@/lib/kma-weather";
import { weatherIconKindLabel } from "@/lib/weather-icon-map";
import { WeatherIcon } from "@/components/WeatherIcon";

export function DashboardWeather({ data }: { data: WeatherSnapshot }) {
  return (
    <a
      href={data.naverWeatherUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col rounded-lg border border-border bg-surface px-3 py-2.5 shadow-card transition hover:border-accent sm:items-end"
    >
      {data.ok ? (
        <div className="flex items-center gap-2.5">
          <WeatherIcon
            kind={data.iconKind}
            title={weatherIconKindLabel(data.iconKind)}
            className="h-10 w-10 shrink-0 text-accent"
          />
          <div className="min-w-0 text-left">
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
          </div>
        </div>
      ) : (
        <p className="max-w-[14rem] text-[11px] leading-snug text-muted">
          {data.message}
        </p>
      )}
      <span className="mt-1.5 text-[10px] font-medium text-accent">
        네이버 날씨 →
      </span>
    </a>
  );
}
