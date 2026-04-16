import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import { env, getAccessTokenSecrets, getRefreshTokenSecrets } from "../config/env";
import { AuthPayload } from "../types/auth";
import { ApiError } from "./http";

export function signAccessToken(payload: AuthPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function signRefreshToken(payload: AuthPayload): string {
  const options: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

function verifyWithSecrets(token: string, secrets: string[]): AuthPayload {
  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret) as AuthPayload;
    } catch {
      continue;
    }
  }
  throw new ApiError({ status: 401, message: "Invalid or expired token" });
}

export function verifyAccessToken(token: string): AuthPayload {
  return verifyWithSecrets(token, getAccessTokenSecrets());
}

export function verifyRefreshToken(token: string): AuthPayload {
  return verifyWithSecrets(token, getRefreshTokenSecrets());
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function randomToken(length = 48): string {
  return crypto.randomBytes(length).toString("hex");
}
