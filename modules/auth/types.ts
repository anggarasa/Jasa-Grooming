import { Role } from "@prisma/client";

export interface AccessTokenPayload {
  sub: string;
  sid: string;
  role: Role;
  tv: number;
  type: "access";
  iss?: string;
  aud?: string;
}

export interface RefreshTokenPayload {
  sub: string;
  sid: string;
  jti: string;
  tv: number;
  type: "refresh";
  iss?: string;
  aud?: string;
}

export interface AuthSessionSummary {
  id: string;
  userId: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  isCurrent: boolean;
}

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tokenVersion: number;
  isActive: boolean;
  lastLoginAt: Date | null;
  passwordChangedAt: Date | null;
}
