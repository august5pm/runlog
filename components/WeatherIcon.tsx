import type { WeatherIconKind } from "@/lib/weather-icon-map";
import { weatherKindEmoji } from "@/lib/weather-icon-map";

const defaultClass =
  "inline-flex h-14 w-14 shrink-0 items-center justify-center text-4xl leading-none select-none";

type Props = {
  kind: WeatherIconKind;
  className?: string;
  /** 접근성: 스크린 리더용 짧은 설명 */
  title?: string;
};

/** PTY/SKY에 대응하는 날씨 이모지 */
export function WeatherIcon({ kind, className, title }: Props) {
  const cls = className ?? defaultClass;
  const emoji = weatherKindEmoji(kind);
  const a11y = title
    ? ({ role: "img" as const, "aria-label": title } as const)
    : ({ role: "presentation" as const, "aria-hidden": true as const } as const);

  return (
    <span className={cls} {...a11y}>
      {emoji}
    </span>
  );
}
