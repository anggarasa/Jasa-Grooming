import {
  LoginInput,
  ChangePasswordInput,
  UpdateProfileInput,
} from "@backend/modules/auth/schemas";
import { Role } from "@prisma/client";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive?: boolean;
  lastLoginAt?: string | null;
  passwordChangedAt?: string | null;
}

export interface SessionItem {
  id: string;
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  isRevoked?: boolean;
  expiresAt: string | Date;
  createdAt: string | Date;
  updatedAt: string | Date;
  isCurrent: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: Record<string, string[]>;
}

export async function loginApi(input: LoginInput): Promise<ApiResponse<{ user: UserProfile }>> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function logoutApi(): Promise<ApiResponse> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

export async function refreshTokenApi(): Promise<ApiResponse<{ user: UserProfile }>> {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

export async function logoutAllApi(): Promise<ApiResponse> {
  const res = await fetch("/api/auth/logout-all", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

export async function changePasswordApi(
  input: ChangePasswordInput
): Promise<ApiResponse> {
  const res = await fetch("/api/auth/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}

export async function fetchSessionsApi(): Promise<ApiResponse<{ sessions: SessionItem[] }>> {
  const res = await fetch("/api/auth/sessions", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  return res.json();
}

export async function revokeSessionApi(sessionId: string): Promise<ApiResponse> {
  const res = await fetch(`/api/auth/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  return res.json();
}

export async function updateProfileApi(
  input: UpdateProfileInput
): Promise<ApiResponse<{ user: UserProfile }>> {
  const res = await fetch("/api/auth/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return res.json();
}
