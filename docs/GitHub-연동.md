# GitHub 연동 · Vercel 가져오기

로컬에 Git이 초기화되어 있으면 아래만 진행하면 됩니다.

## 1. GitHub에서 빈 저장소 만들기

1. [GitHub](https://github.com/new) → **New repository**
2. 이름만 정하고 **README / .gitignore / license 추가하지 않음**(로컬에 이미 있음)
3. **Create repository**

## 2. 로컬에서 원격 연결 후 푸시

프로젝트 루트에서( PowerShell 예시):

```powershell
cd d:\applenamu\study\2026\260429_cursor
git branch -M main
git remote add origin https://github.com/본인계정/저장소이름.git
git push -u origin main
```

- SSH를 쓰면 `git@github.com:본인계정/저장소이름.git` 형태로 `remote add` 합니다.
- 로그인은 GitHub **Personal Access Token**(HTTPS) 또는 SSH 키로 합니다.

## 3. Vercel에서 GitHub 연결

1. [Vercel](https://vercel.com) → **Add New Project**
2. **Import Git Repository** → GitHub 계정 연결 후 방금 만든 저장소 선택
3. Framework는 Next.js 자동 인식, **Environment Variables**에 `.env.example` 참고해 등록(DB·OAuth·날씨 키 등)
4. **Deploy**

이후 `main`에 푸시할 때마다 Vercel이 자동 배포(기본 설정 기준)됩니다.

## 비밀 정보

- `.env`는 **커밋하지 마세요.** (`.gitignore`에 포함됨)
- 저장소는 공개여도 DB URL·OAuth 비밀은 GitHub에 올리지 않고 Vercel 환경 변수만 사용합니다.
