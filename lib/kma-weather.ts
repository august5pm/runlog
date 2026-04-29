import { latLonToGrid } from "@/lib/kma-grid";
import {
  type WeatherIconKind,
  resolveWeatherIconKind,
} from "@/lib/weather-icon-map";

const API_NCST =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst";
const API_FCST =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtFcst";

export type WeatherSnapshot =
  | {
      ok: true;
      tempC: number;
      humidity: number | null;
      precipLabel: string;
      iconKind: WeatherIconKind;
      stationLabel: string;
      naverWeatherUrl: string;
    }
  | { ok: false; message: string; naverWeatherUrl: string; stationLabel: string };

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function getKstParts(d: Date): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
} {
  const dtf = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(d);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
  };
}

/** KST 기준 초단기실황 API용 base_date(YYYYMMDD), base_time(HH00) */
export function getUltraSrtNcstBaseDateTime(now = new Date()): {
  baseDate: string;
  baseTime: string;
} {
  let t = new Date(now.getTime());
  let p = getKstParts(t);
  // 매 시각 정시 관측 — 해당 시각 40분 이전에는 아직 직전 시각 자료 사용
  if (p.minute < 40) {
    t = new Date(t.getTime() - 60 * 60 * 1000);
    p = getKstParts(t);
  }
  return {
    baseDate: `${p.year}${pad2(p.month)}${pad2(p.day)}`,
    baseTime: `${pad2(p.hour)}00`,
  };
}

function ptyLabel(pty: string): string {
  switch (pty) {
    case "0":
      return "강수 없음";
    case "1":
      return "비";
    case "2":
      return "비/눈";
    case "3":
      return "눈";
    case "4":
      return "소나기";
    case "5":
      return "빗방울";
    case "6":
      return "빗방울/눈날림";
    case "7":
      return "눈날림";
    default:
      return "강수";
  }
}

function resolveGrid(): { nx: number; ny: number } {
  const nxRaw = process.env.WEATHER_GRID_NX?.trim();
  const nyRaw = process.env.WEATHER_GRID_NY?.trim();
  if (nxRaw && nyRaw) {
    const nx = parseInt(nxRaw, 10);
    const ny = parseInt(nyRaw, 10);
    if (Number.isFinite(nx) && Number.isFinite(ny)) {
      return { nx, ny };
    }
  }
  const lat = parseFloat(process.env.WEATHER_LAT ?? "37.5665");
  const lon = parseFloat(process.env.WEATHER_LON ?? "126.9780");
  return latLonToGrid(lat, lon);
}

function naverUrl(): string {
  const u = process.env.NAVER_WEATHER_URL?.trim();
  return u && u.startsWith("http") ? u : "https://weather.naver.com/";
}

export function weatherStationLabel(): string {
  const l = process.env.WEATHER_LOCATION_LABEL?.trim();
  return l || "관측 지점";
}

/** BOM·따옴표·CR 제거 후 포털 Encoding/Decoding 키 모두 시도할 수 있는 URL 조각 목록 */
function normalizeServiceKeyRaw(raw: string): string {
  let k = raw.replace(/\r/g, "").trim().replace(/^\uFEFF/, "");
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1).trim();
  }
  return k;
}

function serviceKeyUrlVariants(normalized: string): string[] {
  const k = normalized;
  const out: string[] = [];
  const add = (s: string) => {
    if (s.length > 0 && !out.includes(s)) out.push(s);
  };
  add(k);
  add(encodeURIComponent(k));
  try {
    const decodedOnce = decodeURIComponent(k);
    if (decodedOnce !== k) {
      add(decodedOnce);
      add(encodeURIComponent(decodedOnce));
    }
  } catch {
    /* ignore */
  }
  try {
    add(encodeURIComponent(decodeURIComponent(k)));
  } catch {
    /* ignore */
  }
  return out;
}

/** Decoding(평문) 키는 URL.searchParams.set 한 번이 표준 인코딩 — 수동 문자열 결합과 함께 시도 */
function buildUrlViaURL(
  apiBase: string,
  serviceKeyPlain: string,
  queryRest: URLSearchParams,
): string {
  const u = new URL(apiBase);
  u.searchParams.set("serviceKey", serviceKeyPlain);
  queryRest.forEach((value, name) => {
    u.searchParams.set(name, value);
  });
  return u.toString();
}

function collectRequestUrls(
  apiBase: string,
  keyNormalized: string,
  queryRest: URLSearchParams,
): string[] {
  const queryStr = queryRest.toString();
  const urls: string[] = [];
  const seen = new Set<string>();
  const push = (url: string) => {
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  };

  for (const sk of serviceKeyUrlVariants(keyNormalized)) {
    push(`${apiBase}?serviceKey=${sk}&${queryStr}`);
  }

  const plainCandidates: string[] = [keyNormalized];
  try {
    const d = decodeURIComponent(keyNormalized);
    if (d !== keyNormalized) plainCandidates.push(d);
  } catch {
    /* ignore */
  }
  for (const plain of plainCandidates) {
    push(buildUrlViaURL(apiBase, plain, queryRest));
  }

  return urls;
}

type KmaJson = {
  response?: {
    header?: { resultCode?: string; resultMsg?: string };
    body?: { items?: { item?: unknown } };
  };
};

function parseItems(json: KmaJson): Map<string, string> {
  const raw = json.response?.body?.items?.item;
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const map = new Map<string, string>();
  for (const it of items) {
    if (it && typeof it === "object" && "category" in it && "obsrValue" in it) {
      const o = it as { category: string; obsrValue: string };
      map.set(o.category, o.obsrValue);
    }
  }
  return map;
}

/** 초단기예보: 같은 발표 시각에서 가장 늦은 fcstTime의 SKY(맑음/구름/흐림) */
function pickSkyFromFcst(json: KmaJson): string | null {
  const raw = json.response?.body?.items?.item;
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const skyRows: { sortKey: string; value: string }[] = [];
  for (const it of items) {
    if (!it || typeof it !== "object") continue;
    const o = it as Record<string, unknown>;
    if (o.category !== "SKY") continue;
    const fd = String(o.fcstDate ?? "");
    const ft = String(o.fcstTime ?? "");
    const fcstValue = String(o.fcstValue ?? "");
    if (!fd || !ft) continue;
    skyRows.push({ sortKey: `${fd}${ft}`, value: fcstValue });
  }
  if (skyRows.length === 0) return null;
  skyRows.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  return skyRows[skyRows.length - 1]?.value ?? null;
}

type KmaResult =
  | { ok: true; json: KmaJson }
  | { ok: false; message: string };

async function fetchKmaUntilOk(urls: string[]): Promise<KmaResult> {
  let lastMessage = "날씨 정보를 가져오지 못했습니다.";

  for (const url of urls) {
    let res: Response;
    try {
      res = await fetch(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
    } catch {
      continue;
    }

    const text = await res.text();
    let json: KmaJson;
    try {
      json = JSON.parse(text) as KmaJson;
    } catch {
      const head = text.trimStart().slice(0, 80);
      if (res.status === 401) {
        lastMessage =
          "공공데이터 인증 실패(401). 마이페이지 「일반 인증키(Encoding)」를 그대로 넣었는지 확인하고, 「단기예보(VilageFcstInfoService_2.0)·초단기실황」 활용 승인·유효 기간을 확인하세요. 안 되면 Decoding 키로 교체해 보세요.";
      } else if (head.startsWith("<")) {
        lastMessage =
          "날씨 API가 XML을 반환했습니다. 인증키·활용신청(단기예보 VilageFcstInfoService_2.0·초단기실황)을 확인하세요.";
      } else {
        lastMessage = `날씨 API 응답 파싱 오류 (HTTP ${res.status}).`;
      }
      if (res.status === 401) continue;
      return { ok: false, message: lastMessage };
    }

    const code = json.response?.header?.resultCode;
    const apiMsg = json.response?.header?.resultMsg?.trim();

    if (code === "00") {
      return { ok: true, json };
    }
    lastMessage = apiMsg || `오류 코드 ${code ?? "?"}`;

    if (res.status !== 401) {
      return { ok: false, message: lastMessage };
    }
  }

  return { ok: false, message: lastMessage };
}

export async function getWeatherSnapshot(): Promise<WeatherSnapshot> {
  const keyRaw = normalizeServiceKeyRaw(process.env.DATA_GO_KR_SERVICE_KEY ?? "");
  const naverWeatherUrl = naverUrl();
  const stationLabel = weatherStationLabel();

  if (!keyRaw) {
    return {
      ok: false,
      message: "공공데이터포털 서비스키가 설정되지 않았습니다.",
      naverWeatherUrl,
      stationLabel,
    };
  }

  const { nx, ny } = resolveGrid();
  const { baseDate, baseTime } = getUltraSrtNcstBaseDateTime();

  const ncstParams = new URLSearchParams({
    pageNo: "1",
    numOfRows: "10",
    dataType: "JSON",
    base_date: baseDate,
    base_time: baseTime,
    nx: String(nx),
    ny: String(ny),
  });

  /** SKY 등 예보 항목을 충분히 받기 위해 행 수 확대 */
  const fcstParams = new URLSearchParams({
    pageNo: "1",
    numOfRows: "60",
    dataType: "JSON",
    base_date: baseDate,
    base_time: baseTime,
    nx: String(nx),
    ny: String(ny),
  });

  const ncstUrls = collectRequestUrls(API_NCST, keyRaw, ncstParams);
  const fcstUrls = collectRequestUrls(API_FCST, keyRaw, fcstParams);

  const [ncstResult, fcstResult] = await Promise.all([
    fetchKmaUntilOk(ncstUrls),
    fetchKmaUntilOk(fcstUrls),
  ]);

  if (!ncstResult.ok) {
    return {
      ok: false,
      message: ncstResult.message,
      naverWeatherUrl,
      stationLabel,
    };
  }

  const map = parseItems(ncstResult.json);
  const t1h = map.get("T1H");
  if (t1h == null) {
    return {
      ok: false,
      message: "기온 데이터가 없습니다. 잠시 후 다시 시도해 주세요.",
      naverWeatherUrl,
      stationLabel,
    };
  }

  const tempC = parseFloat(t1h);
  const reh = map.get("REH");
  const humidity = reh != null ? parseInt(reh, 10) : null;
  const pty = map.get("PTY") ?? "0";
  const precipLabel = ptyLabel(pty);

  const sky =
    fcstResult.ok ? pickSkyFromFcst(fcstResult.json) : null;
  const iconKind = resolveWeatherIconKind(pty, sky);

  return {
    ok: true,
    tempC: Math.round(tempC * 10) / 10,
    humidity: humidity != null && Number.isFinite(humidity) ? humidity : null,
    precipLabel,
    iconKind,
    stationLabel,
    naverWeatherUrl,
  };
}
