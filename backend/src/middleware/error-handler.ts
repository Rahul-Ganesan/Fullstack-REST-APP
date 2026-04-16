import { NextFunction, Request, Response } from "express";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { ZodError } from "zod";

import { ApiError } from "../utils/http";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: "Route not found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ message: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      errors: err.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (err instanceof JsonWebTokenError || err instanceof TokenExpiredError) {
    res.status(401).json({ message: "Invalid or expired token" });
    return;
  }

  res.status(500).json({ message: "Internal server error" });
}
