export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*", "/runs/:path*", "/settings/:path*"],
};
