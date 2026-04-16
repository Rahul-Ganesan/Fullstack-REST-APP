import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";

import { prisma } from "../../db/prisma";
import { ApiError } from "../../utils/http";
import { randomToken, sha256 } from "../../utils/tokens";

function computeExpiry(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });
}

export async function inviteUser(input: { email: string; role: "admin" | "analyst" }) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ApiError({ status: 409, message: "User with this email already exists" });
  }

  const temporaryPassword = randomToken(12);
  const passwordHash = await bcrypt.hash(temporaryPassword, 12);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      role: input.role as Role,
      passwordHash,
      isActive: false,
    },
  });

  const inviteToken = randomToken(24);
  await prisma.userToken.create({
    data: {
      userId: user.id,
      type: "invite",
      tokenHash: sha256(inviteToken),
      expiresAt: computeExpiry(7),
    },
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
    /** One-time password for first login after admin activates the account (demo: returned in API; use email in production). */
    temporaryPassword,
    inviteToken,
  };
}

export async function updateUserStatus(userId: number, isActive: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError({ status: 404, message: "User not found" });
  }

  return prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: { id: true, email: true, role: true, isActive: true, createdAt: true },
  });
}

export async function adminInitiateReset(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new ApiError({ status: 404, message: "User not found" });
  }

  const resetToken = randomToken(24);
  await prisma.userToken.create({
    data: {
      userId: user.id,
      type: "reset",
      tokenHash: sha256(resetToken),
      expiresAt: computeExpiry(1),
    },
  });

  return { resetToken, userId: user.id, email: user.email };
}
