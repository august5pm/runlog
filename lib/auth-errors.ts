/** NextAuth `error` 쿼리 값 → 사용자용 문구 */
export function getAuthErrorMessage(code: string | undefined): string {
  switch (code) {
    case "Configuration":
      return "서버 설정 오류입니다. .env의 GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXTAUTH_SECRET, NEXTAUTH_URL을 확인하세요.";
    case "AccessDenied":
      return "로그인이 거부되었습니다. OAuth 동의 화면이 테스트 모드면 해당 Google 계정을 테스트 사용자로 추가했는지 확인하세요.";
    case "Verification":
      return "인증 토큰이 만료되었습니다. 다시 시도하세요.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
    case "EmailCreateAccount":
    case "Callback":
      return "Google 로그인 처리 중 오류가 났습니다. (1) 터미널에서 npx prisma db push 로 DB 테이블 생성 (2) Google 콘솔 리디렉션 URI: http://localhost:3000/api/auth/callback/google (3) 브라우저 주소와 NEXTAUTH_URL을 localhost로 통일 (4) 개발 서버 재시작 후 재시도.";
    case "Default":
    default:
      return code
        ? `로그인 오류 코드: ${code}`
        : "로그인 요청에 실패했습니다. 터미널의 NextAuth 로그와 브라우저 네트워크 탭의 /api/auth 요청을 확인하세요.";
  }
}
