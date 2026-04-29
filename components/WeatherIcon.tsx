import type { WeatherIconKind } from "@/lib/weather-icon-map";

const defaultClass = "h-14 w-14 shrink-0 text-foreground";

type Props = {
  kind: WeatherIconKind;
  className?: string;
  /** 접근성: 스크린 리더용 짧은 설명 */
  title?: string;
};

/** PTY/SKY에 대응하는 단순 SVG 라인 아이콘 (외부 에셋 없음) */
export function WeatherIcon({ kind, className, title }: Props) {
  const cls = className ?? defaultClass;
  const a11y = title
    ? ({ role: "img" as const, "aria-label": title } as const)
    : ({ role: "presentation" as const, "aria-hidden": true as const } as const);
  const common = { className: cls, ...a11y };
  switch (kind) {
    case "clear":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...common}>
          <circle cx="32" cy="28" r="12" stroke="currentColor" strokeWidth="2.5" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x1 = 32 + Math.cos(rad) * 16;
            const y1 = 28 + Math.sin(rad) * 16;
            const x2 = 32 + Math.cos(rad) * 21;
            const y2 = 28 + Math.sin(rad) * 21;
            return (
              <line
                key={deg}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            );
          })}
        </svg>
      );
    case "partlyCloudy":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...common}>
          <circle cx="40" cy="22" r="9" stroke="currentColor" strokeWidth="2.5" />
          <path
            d="M18 44c0-6 5-11 12-11h8c7 0 12 5 12 11v2H18v-2z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "cloudy":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...common}>
          <path
            d="M14 42c0-7 6-13 14-13 1 0 3 0 4 1 2-5 7-9 13-9 8 0 14 6 14 14v2H14v-5z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "rain":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...common}>
          <path
            d="M16 34c0-8 7-14 15-14 2 0 4 0 6 1 2-6 8-10 15-10 9 0 16 7 16 16v3H16v-4z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M22 46v10M32 44v12M42 46v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case "drizzle":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...common}>
          <path
            d="M18 32c0-7 6-13 14-13 2 0 4 1 6 2 2-5 8-9 14-9 8 0 14 6 14 13v3H18v-4z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="48" r="1.8" fill="currentColor" />
          <circle cx="34" cy="52" r="1.8" fill="currentColor" />
          <circle cx="44" cy="48" r="1.8" fill="currentColor" />
        </svg>
      );
    case "sleet":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...common}>
          <path
            d="M16 34c0-8 7-14 15-14 2 0 4 0 6 1 2-6 8-10 15-10 9 0 16 7 16 16v3H16v-4z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path d="M22 46v8M30 44v10M38 46v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <circle cx="28" cy="54" r="2" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="38" cy="54" r="2" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      );
    case "snow":
      return (
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" {...common}>
          <path
            d="M16 34c0-8 7-14 15-14 2 0 4 0 6 1 2-6 8-10 15-10 9 0 16 7 16 16v3H16v-4z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          {[24, 32, 40].map((cx) => (
            <path
              key={cx}
              d={`M${cx} 44v14M${cx - 5} 48l10 6M${cx + 5} 48l-10 6`}
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          ))}
        </svg>
      );
  }
}
