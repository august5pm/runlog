import Image from "next/image";

/** public/logo.png 원본 비율 (가로×세로) — 찌그러짐 방지 */
const LOGO_SRC_WIDTH = 517;
const LOGO_SRC_HEIGHT = 514;
const LOGO_ASPECT = LOGO_SRC_WIDTH / LOGO_SRC_HEIGHT;

export function RunLogLogo({
  size = 32,
  className,
  priority,
}: {
  /** 세로 기준(px). 가로는 비율에 맞춰 계산 */
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  const height = size;
  const width = Math.round(size * LOGO_ASPECT);

  return (
    <Image
      src="/logo.png"
      alt=""
      width={width}
      height={height}
      className={className ? `shrink-0 ${className}` : "shrink-0"}
      priority={priority}
    />
  );
}
