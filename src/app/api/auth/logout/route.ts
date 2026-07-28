import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get("error");
  const loginUrl = new URL("/login", request.url);
  if (error) {
    loginUrl.searchParams.set("error", error);
  }

  const response = NextResponse.redirect(loginUrl);
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
