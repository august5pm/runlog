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

/** PTY/SKY 종류별 표시 이모지 */
export const WEATHER_KIND_EMOJI: Record<WeatherIconKind, string> = {
  clear: "☀️",
  partlyCloudy: "⛅",
  cloudy: "☁️",
  rain: "🌧️",
  drizzle: "🌦️",
  sleet: "🌨️",
  snow: "❄️",
};

export function weatherKindEmoji(kind: WeatherIconKind): string {
  return WEATHER_KIND_EMOJI[kind];
}

/** PTY·SKY → UI 아이콘 종류 (강수가 있으면 SKY보다 PTY 우선) */
export function resolveWeatherIconKind(
  pty: string,
  sky: string | null,
): WeatherIconKind {
  const p = pty.trim();
  switch (p) {
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

  const s = sky?.trim() ?? "";
  switch (s) {
    case "1":
      return "clear";
    case "2":
      /** 일부 응답·문서에서 맑음↔구름많음 사이 코드로 쓰이는 경우 */
      return "partlyCloudy";
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

