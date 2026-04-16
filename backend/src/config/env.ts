import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_SECRET_PREVIOUS: z.string().optional(),
  JWT_EXPIRES_IN: z.string().default("1h"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET must be at least 16 characters"),
  JWT_REFRESH_SECRET_PREVIOUS: z.string().optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  COOKIE_SECURE: z.coerce.boolean().default(false),
});

/** Merge process.env with safe defaults so older .env files still boot (set JWT_REFRESH_SECRET in production). */
function envWithDefaults(): NodeJS.ProcessEnv {
  const jwtSecret = process.env.JWT_SECRET;
  const refreshMissing = !process.env.JWT_REFRESH_SECRET?.trim();
  const canDeriveRefresh =
    refreshMissing && typeof jwtSecret === "string" && jwtSecret.length >= 16;

  return {
    ...process.env,
    ...(canDeriveRefresh ? { JWT_REFRESH_SECRET: `${jwtSecret}-refresh` } : {}),
  };
}

const parsed = envSchema.safeParse(envWithDefaults());

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => issue.message).join(", ");
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = parsed.data;

export function getAccessTokenSecrets(): string[] {
  const previous = env.JWT_SECRET_PREVIOUS
    ? env.JWT_SECRET_PREVIOUS.split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  return [env.JWT_SECRET, ...previous];
}

export function getRefreshTokenSecrets(): string[] {
  const previous = env.JWT_REFRESH_SECRET_PREVIOUS
    ? env.JWT_REFRESH_SECRET_PREVIOUS.split(",").map((value) => value.trim()).filter(Boolean)
    : [];
  return [env.JWT_REFRESH_SECRET, ...previous];
}
