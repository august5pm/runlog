"use client";

import { useEffect, useState } from "react";
import type { WeatherSnapshot } from "@/lib/kma-weather";
import { DashboardWeather } from "@/components/DashboardWeather";
import { DashboardWeatherSkeleton } from "@/components/DashboardWeatherSuspended";

function fallbackErrorSnapshot(): WeatherSnapshot {
  return {
    ok: false,
    message: "날씨 정보를 불러오지 못했습니다.",
    naverWeatherUrl: "https://weather.naver.com/",
    stationLabel: "",
  };
}

export function DashboardWeatherLocation() {
  const [data, setData] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDefault() {
      try {
        const res = await fetch("/api/weather/snapshot");
        if (cancelled) return;
        if (res.ok) {
          setData((await res.json()) as WeatherSnapshot);
        } else {
          setData(fallbackErrorSnapshot());
        }
      } catch {
        if (!cancelled) setData(fallbackErrorSnapshot());
      }
    }

    async function loadWithCoords(latitude: number, longitude: number) {
      try {
        const res = await fetch(
          `/api/weather/snapshot?lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`,
        );
        if (cancelled) return;
        if (res.ok) {
          setData((await res.json()) as WeatherSnapshot);
        } else {
          await loadDefault();
        }
      } catch {
        if (!cancelled) await loadDefault();
      }
    }

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      void loadDefault();
      return () => {
        cancelled = true;
      };
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void loadWithCoords(pos.coords.latitude, pos.coords.longitude);
      },
      () => {
        void loadDefault();
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300_000,
        timeout: 12_000,
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) {
    return (
      <div className="shrink-0 max-w-[min(100%,16rem)] max-sm:pt-0 sm:pt-0.5">
        <DashboardWeatherSkeleton />
      </div>
    );
  }

  return (
    <div className="shrink-0 max-w-[min(100%,16rem)] max-sm:pt-0 sm:pt-0.5">
      <DashboardWeather data={data} />
    </div>
  );
}
