/**
 * 기상청 코드 매핑
 * - PTY: 초단기실황 강수형태
 * - SKY: 초단기예보 하늘상태 (1 맑음, 3 구름많음, 4 흐림)
 */
export type WeatherIconKind =
  | "clear"
  | "partlyCloudy"
  | "cloudy"
  | "rain"
  | "sleet"
  | "snow"
  | "drizzle";

/** PTY·SKY → UI 아이콘 종류 (강수가 있으면 SKY보다 PTY 우선) */
export function resolveWeatherIconKind(
  pty: string,
  sky: string | null,
): WeatherIconKind {
  switch (pty) {
    case "1":
    case "4":
      return "rain";
    case "5":
      return "drizzle";
    case "2":
    case "6":
      return "sleet";
    case "3":
    case "7":
      return "snow";
    case "0":
    default:
      break;
  }

  switch (sky) {
    case "1":
      return "clear";
    case "3":
      return "partlyCloudy";
    case "4":
      return "cloudy";
    default:
      return "partlyCloudy";
  }
}

export function weatherIconKindLabel(kind: WeatherIconKind): string {
  const labels: Record<WeatherIconKind, string> = {
    clear: "맑음",
    partlyCloudy: "구름 많음",
    cloudy: "흐림",
    rain: "비",
    drizzle: "빗방울",
    sleet: "비 또는 눈",
    snow: "눈",
  };
  return labels[kind];
}

