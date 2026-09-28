import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = new Set(["/", "/login", "/register", "/terms", "/privacy"]);

function continueWithPath(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-sira-path", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/_next") || pathname === "/sw.js" || pathname === "/icon" || pathname === "/apple-icon") {
    return NextResponse.next();
  }
  const token = request.cookies.get("sira_session")?.value;
  const isPublic = publicPaths.has(pathname);
  if (!token) {
    return isPublic ? continueWithPath(request) : NextResponse.redirect(new URL("/login", request.url));
  }
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const mfa = payload.mfa === true;
    if (!mfa && pathname !== "/login") {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (mfa && (pathname === "/login" || pathname === "/register" || pathname === "/security")) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return continueWithPath(request);
  } catch {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("sira_session", "", { path: "/", maxAge: 0 });
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
