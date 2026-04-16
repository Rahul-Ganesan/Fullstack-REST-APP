import { NextFunction, Request, Response } from "express";
import { AuthPayload, AppRole } from "../types/auth";
import { ApiError } from "../utils/http";
import { verifyAccessToken } from "../utils/tokens";

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    throw new ApiError({ status: 401, message: "Missing bearer token" });
  }

  const token = header.slice(7);
  const decoded = verifyAccessToken(token) as AuthPayload;
  req.user = decoded;
  next();
}

export function requireRole(roles: AppRole[]) {
  return function roleGuard(req: Request, _res: Response, next: NextFunction): void {
    if (!req.user) {
      throw new ApiError({ status: 401, message: "Unauthorized" });
    }
    if (!roles.includes(req.user.role)) {
      throw new ApiError({ status: 403, message: "Forbidden" });
    }
    next();
  };
}
