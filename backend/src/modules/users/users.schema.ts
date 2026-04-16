import { z } from "zod";

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "analyst"]).default("analyst"),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});
