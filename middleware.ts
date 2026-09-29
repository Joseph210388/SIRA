import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";

const publicPaths = new Set(["/", "/login", "/register", "/terms", "/privacy"]);

function continueWithPath(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-sira-path", request.nextUrl.pathname);
  headers.set("x-sira-search", request.nextUrl.search);
  return NextResponse.next({ request: { headers } });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const search = request.nextUrl.search;
  if (search.includes("%3F") || search.includes("%3f")) {
    const decoded = decodeURIComponent(search);
    const cut = decoded.indexOf("?", 1);
    if (cut > 0) {
      const fixed = `${decoded.slice(0, cut)}&${decoded.slice(cut + 1)}`;
      return NextResponse.redirect(new URL(`${pathname}${fixed}`, request.url));
    }
  }
  // El manifiesto y los iconos no son páginas. Si se redirigen al acceso, el navegador
  // intenta leer HTML como JavaScript y la pantalla se recarga sola.
  if (
    pathname.startsWith("/_next") ||
    pathname === "/sw.js" ||
    pathname === "/icon" ||
    pathname === "/apple-icon" ||
    pathname === "/manifest.webmanifest" ||
    pathname.endsWith(".webmanifest")
  ) {
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
