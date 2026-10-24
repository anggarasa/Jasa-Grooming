import { NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "@/modules/auth/token.service";

export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAge: number;
}

export function getAccessCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 15 * 60, // 15 menit
  };
}

export function getRefreshCookieOptions(): CookieOptions {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60, // 7 hari
  };
}

export function setAuthCookies(
  response: NextResponse,
  tokens: { accessToken?: string; refreshToken?: string }
): void {
  if (tokens.accessToken) {
    response.cookies.set(
      ACCESS_COOKIE_NAME,
      tokens.accessToken,
      getAccessCookieOptions()
    );
  }

  if (tokens.refreshToken) {
    response.cookies.set(
      REFRESH_COOKIE_NAME,
      tokens.refreshToken,
      getRefreshCookieOptions()
    );
  }
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_COOKIE_NAME, "", {
    ...getAccessCookieOptions(),
    maxAge: 0,
  });
  response.cookies.set(REFRESH_COOKIE_NAME, "", {
    ...getRefreshCookieOptions(),
    maxAge: 0,
  });
}
