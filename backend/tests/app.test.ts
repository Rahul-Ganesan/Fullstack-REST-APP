import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.PORT = "4000";
  process.env.DATABASE_URL = "mysql://root:password@localhost:3306/customer_analytics";
  process.env.JWT_SECRET = "test-jwt-secret-1234";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-1234";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.JWT_REFRESH_EXPIRES_IN = "7d";
  process.env.CORS_ORIGIN = "http://localhost:5173";
  process.env.COOKIE_SECURE = "false";
});

describe("app", () => {
  it("returns healthy status", async () => {
    const { app } = await import("../src/app");
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("rejects /auth/me without token", async () => {
    const { app } = await import("../src/app");
    const response = await request(app).get("/api/v1/auth/me");
    expect(response.status).toBe(401);
  });
});
