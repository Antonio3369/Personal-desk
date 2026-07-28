import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import {
  decodeSessionPayload,
  SESSION_COOKIE,
} from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/uploads/")) {
    return new NextResponse(null, { status: 404 });
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;

  if (!secret) {
    return NextResponse.next();
  }

  let session = null;
  if (token) {
    try {
      const { payload } = await jwtVerify(
        token,
        new TextEncoder().encode(secret),
      );
      session = decodeSessionPayload(payload as Record<string, unknown>);
    } catch {
      session = null;
    }
  }

  const authenticated = session !== null;

  if (pathname.startsWith("/login") || pathname.startsWith("/invite")) {
    if (authenticated && pathname.startsWith("/login")) {
      const dest = session!.role === "admin" ? "/admin" : "/";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin")) {
    if (!authenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (session!.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  if (!authenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session!.role === "admin") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  if (!session!.workspaceId) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
