# RunLog — 러닝 기록 (토이)

Next.js 14 · Tailwind · Prisma · PostgreSQL(Supabase) · NextAuth(Google) · Recharts

기획·디자인 문서는 `docs/` 를 참고하세요.

GitHub 저장소 만들기·푸시·Vercel 연결은 [docs/GitHub-연동.md](./docs/GitHub-연동.md) 를 따르세요.

## 사전 준비

- Node.js 20 LTS 권장
- [Supabase](https://supabase.com) PostgreSQL 프로젝트
- [Google Cloud Console](https://console.cloud.google.com/apis/credentials) OAuth 클라이언트 (웹 애플리케이션)

## 환경 변수

`.env.example` 을 복사해 `.env` 로 저장하고 값을 채웁니다.

- `DATABASE_URL`: **Transaction pooler** (Prisma + Supabase 런타임용)
- `DIRECT_URL`: **Direct connection** (`prisma migrate` 용)
- `NEXTAUTH_URL`: 로컬은 `http://localhost:3000`, 배포 시 Vercel 도메인
- `NEXTAUTH_SECRET`: `openssl rand -base64 32` 등으로 생성
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

Google OAuth 승인된 리디렉션 URI에 `http://localhost:3000/api/auth/callback/google` 와 프로덕션 URL을 등록합니다.

**날씨(대시보드):** [공공데이터포털](https://www.data.go.kr/) 기상청 단기예보 API용 `DATA_GO_KR_SERVICE_KEY` 가 필요합니다. 서비스 미신청·키 미설정 시 대시보드에 안내 문구만 표시됩니다. 위치·링크 등은 `.env.example` 의 `WEATHER_*`, `NAVER_WEATHER_URL` 주석을 참고하세요.

## 데이터베이스

```bash
npm install
npx prisma migrate dev --name init
```

또는 스키마만 반영:

```bash
npx prisma db push
```

## 개발 서버

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 을 엽니다.

## 배포 (Vercel)

- 저장소 연결 후 환경 변수를 동일 키로 등록
- Build Command: `prisma generate && next build` (필요 시 Vercel 빌드 설정에 `prisma generate` 포함)
- 프로덕션 DB에 마이그레이션 적용 (`migrate deploy` 등 운영 정책에 맞게 실행)

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 프로덕션 빌드 |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:studio` | Prisma Studio |
