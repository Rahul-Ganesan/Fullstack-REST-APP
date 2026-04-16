export type AppRole = "admin" | "analyst";

export interface AuthPayload {
  userId: number;
  email: string;
  role: AppRole;
}
