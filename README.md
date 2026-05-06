# RunLog — 러닝 기록 (토이)

Google 로그인 후 러닝 세션을 기록하고, **주·월·년·전체 거리 차트**, **목표·연속 기록**, **랭킹**, **커뮤니티(한 줄·댓글·반응)**, **대시보드 날씨 요약**을 쓰는 웹 앱입니다.

**스택:** Next.js 14(App Router) · React 18 · TypeScript · Tailwind CSS · Prisma · PostgreSQL(Supabase) · NextAuth.js(Google) · Recharts

---

## 문서

| 문서 | 내용 |
|------|------|
| [기획-러닝기록앱.md](./docs/기획-러닝기록앱.md) | 목표, 기능 범위(F-01~), 데이터 모델 |
| [디자인-러닝기록앱.md](./docs/디자인-러닝기록앱.md) | 화면·내비·토큰·와이어프레임 |
| [GitHub-연동.md](./docs/GitHub-연동.md) | 저장소·Vercel 연결 |

---

## 주요 기능

- **인증:** Google OAuth, JWT 세션 + Prisma 어댑터 (미설정 시 랜딩에서 안내)
- **기록 CRUD:** 거리·시간·메모, 선택 필드 심박·케이던스 (`/runs`, `/runs/new`, `/runs/[id]/edit`)
- **대시보드:** 연속 기록 일수, 주·월 거리 목표 달성률, 기간별(`주`·`월`·`년`·`전체`, `?range=`) 횟수·거리·운동 시간, 막대 차트, 최근 기록 5건
- **랭킹:** 기간·지표(거리/횟수)별 리더보드 (`/ranking`)
- **커뮤니티:** 챌린지·자유 한 줄 글, 선택적 러닝 기록 첨부, **댓글**·**이모지 반응** (`/community`, API: `app/api/community/...`)
- **설정:** 닉네임·프로필 이모지(프리셋)·주/월 거리 목표 (`PATCH /api/user/profile`)
- **날씨:** 공공데이터포털 기상청 API(초단기실황·초단기예보), 헤더 우측 스냅샷 + **PTY/SKY → 이모지**(`WeatherIcon`, 키 없으면 안내 문구만)
- **반응형:** 모바일 하단 탭(대시보드·랭킹·커뮤니티·기록·설정) · 데스크톱 상단 헤더 (`components/AppChrome.tsx`)

---

## 사전 준비

- **Node.js** 20 LTS 권장  
- **[Supabase](https://supabase.com)** 등 PostgreSQL 인스턴스  
- **[Google Cloud Console](https://console.cloud.google.com/apis/credentials)** 에서 OAuth 클라이언트(웹 애플리케이션)  
- **날씨:** [공공데이터포털](https://www.data.go.kr/) 에서 기상청 단기예보(VilageFcstInfoService) 활용 신청 및 인증키

---

## 환경 변수

`.env.example` 을 복사해 `.env` 로 두고 값을 채웁니다.

### 필수

| 변수 | 설명 |
|------|------|
| `DATABASE_URL` | PostgreSQL URL. Supabase **Transaction pooler** 권장(Prisma 런타임) |
| `DIRECT_URL` | **Direct** 연결 URL (`prisma migrate` 등). `schema.prisma` 의 `directUrl` |
| `NEXTAUTH_URL` | 로컬: `http://localhost:3000` · 배포: `https://프로젝트도메인` |
| `NEXTAUTH_SECRET` | 예: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google OAuth 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 클라이언트 보안 비밀 |

Google Cloud **승인된 리디렉션 URI** 에 다음을 등록합니다.

- 로컬: `http://localhost:3000/api/auth/callback/google`
- 배포: `https://배포도메인/api/auth/callback/google`

### 날씨(선택)

| 변수 | 설명 |
|------|------|
| `DATA_GO_KR_SERVICE_KEY` | 일반 인증키(Encoding 권장). 없으면 대시보드 날씨 영역에 오류·안내만 표시 |
| `WEATHER_LAT` / `WEATHER_LON` | 관측 격자 변환용 위·경도(기본값 있음) |
| `WEATHER_GRID_NX` / `WEATHER_GRID_NY` | 격자 직접 지정 시 |
| `NAVER_WEATHER_URL` | 날씨 카드 링크 목적지(기본 네이버 날씨) |

기타 `WEATHER_LOCATION_LABEL` 등은 `.env.example` 주석 참고.

---

## 데이터베이스

```bash
npm install
npx prisma migrate dev --name init
```

이후 스키마 변경 시에는 `npx prisma migrate dev`(마이그레이션 이름 지정)를 사용합니다.

스키마만 맞추려면:

```bash
npx prisma db push
```

프로덕션 배포 후에는 운영 정책에 맞게 `prisma migrate deploy` 등으로 스키마를 적용합니다.

---

## 개발 서버

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) 에서 확인합니다.

---

## API (Route Handlers)

대부분 인증이 필요합니다. 자세한 쿼리·바디는 기획서 및 `app/api` 참고.

| Method | Path |
|--------|------|
| GET / POST | `/api/runs` |
| GET / PATCH / DELETE | `/api/runs/[id]` |
| PATCH | `/api/user/profile` |
| POST | `/api/community/posts` |
| POST | `/api/community/posts/[postId]/comments` |
| POST | `/api/community/posts/[postId]/reactions` |

---

## 배포 (Vercel)

1. GitHub 저장소 연결 후 **Environment Variables** 에 위 변수를 등록(프로덕션·프리뷰 필요 시 구분).  
2. **`NEXTAUTH_URL`** 을 배포 URL(예: `https://xxx.vercel.app`)으로 설정하고, Google OAuth 리디렉션 URI에 동일 호스트의 콜백을 추가합니다.  
3. 빌드: 저장소의 `postinstall` 에서 `prisma generate` 가 실행되므로 기본 **`next build`** 로 동작하는 경우가 많습니다. 필요 시 빌드 커맨드만 조정합니다.  
4. DB 마이그레이션은 CI 또는 로컬에서 프로덕션 DB에 대해 실행합니다.

---

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 (`build` 후) |
| `npm run lint` | ESLint |
| `npm run db:generate` | Prisma Client 생성 |
| `npm run db:push` | 스키마를 DB에 반영(`db push`) |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:studio` | Prisma Studio |

`npm install` 시 **`postinstall`** 으로 `prisma generate` 가 한 번 실행됩니다.
