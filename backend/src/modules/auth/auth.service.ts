import bcrypt from "bcryptjs";

import { prisma } from "../../db/prisma";
import { AuthPayload, AppRole } from "../../types/auth";
import { ApiError } from "../../utils/http";
import {
  randomToken,
  sha256,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../utils/tokens";

function computeExpiry(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

async function createRefreshToken(payload: AuthPayload) {
  const refreshToken = signRefreshToken(payload);
  await prisma.userToken.create({
    data: {
      userId: payload.userId,
      tokenHash: sha256(refreshToken),
      type: "refresh",
      expiresAt: computeExpiry(7),
    },
  });
  return refreshToken;
}

export async function register(input: { email: string; password: string; role: AppRole }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError({ status: 409, message: "Email already exists" });
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { email: input.email, passwordHash, role: input.role },
    select: { id: true, email: true, role: true, createdAt: true, isActive: true },
  });

  const token = signAccessToken({ userId: user.id, email: user.email, role: user.role as AppRole });
  const refreshToken = await createRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role as AppRole,
  });

  return { user, token, refreshToken };
}

export async function login(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new ApiError({ status: 401, message: "Invalid credentials" });
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new ApiError({ status: 401, message: "Invalid credentials" });
  }

  if (!user.isActive) {
    throw new ApiError({ status: 403, message: "User is deactivated. Contact admin." });
  }

  const payload = { userId: user.id, email: user.email, role: user.role as AppRole };
  const token = signAccessToken(payload);
  const refreshToken = await createRefreshToken(payload);

  return {
    token,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt },
  };
}

export async function me(userId: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, role: true, createdAt: true, isActive: true },
  });

  if (!user) {
    throw new ApiError({ status: 404, message: "User not found" });
  }

  return user;
}

export async function refreshSession(refreshToken: string) {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = sha256(refreshToken);

  const stored = await prisma.userToken.findFirst({
    where: {
      userId: payload.userId,
      tokenHash,
      type: "refresh",
      revokedAt: null,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!stored) {
    throw new ApiError({ status: 401, message: "Refresh token is invalid or expired" });
  }

  await prisma.userToken.update({
    where: { id: stored.id },
    data: { usedAt: new Date(), revokedAt: new Date() },
  });

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || !user.isActive) {
    throw new ApiError({ status: 403, message: "User is inactive" });
  }

  const nextPayload = { userId: user.id, email: user.email, role: user.role as AppRole };
  const accessToken = signAccessToken(nextPayload);
  const nextRefreshToken = await createRefreshToken(nextPayload);

  return { accessToken, refreshToken: nextRefreshToken };
}

export async function logout(refreshToken?: string) {
  if (!refreshToken) {
    return;
  }
  await prisma.userToken.updateMany({
    where: {
      tokenHash: sha256(refreshToken),
      type: "refresh",
      revokedAt: null,
    },
    data: { revokedAt: new Date(), usedAt: new Date() },
  });
}

export async function forgotPassword(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { message: "If this email exists, reset instructions were created." };
  }

  const rawToken = randomToken(24);
  await prisma.userToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(rawToken),
      type: "reset",
      expiresAt: computeExpiry(1),
    },
  });

  return {
    message: "Reset token generated (demo mode).",
    resetToken: rawToken,
  };
}

export async function resetPassword(input: { token: string; password: string }) {
  const tokenHash = sha256(input.token);
  const record = await prisma.userToken.findFirst({
    where: {
      tokenHash,
      type: "reset",
      revokedAt: null,
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
    include: { user: true },
  });

  if (!record) {
    throw new ApiError({ status: 400, message: "Reset token is invalid or expired" });
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash, isActive: true },
    }),
    prisma.userToken.update({
      where: { id: record.id },
      data: { usedAt: new Date(), revokedAt: new Date() },
    }),
  ]);

  return { message: "Password reset successful." };
}
