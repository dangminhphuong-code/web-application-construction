import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME ?? "access_token";

export function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  if (isDashboard && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"]
};
