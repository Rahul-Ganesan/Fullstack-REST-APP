import { NextFunction, Request, Response } from "express";

import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "./auth.schema";
import * as authService from "./auth.service";
import { env } from "../../config/env";

const refreshCookieName = "refresh_token";

function setRefreshCookie(res: Response, token: string) {
  res.cookie(refreshCookieName, token, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/api/v1/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(refreshCookieName, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: "lax",
    path: "/api/v1/auth",
  });
}

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const input = registerSchema.parse(req.body);
    const data = await authService.register(input);
    setRefreshCookie(res, data.refreshToken);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const data = await authService.login(input);
    setRefreshCookie(res, data.refreshToken);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[refreshCookieName] as string | undefined;
    if (!token) {
      res.status(401).json({ message: "Refresh token missing" });
      return;
    }
    const data = await authService.refreshSession(token);
    setRefreshCookie(res, data.refreshToken);
    res.status(200).json({ token: data.accessToken });
  } catch (error) {
    next(error);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[refreshCookieName] as string | undefined;
    await authService.logout(token);
    clearRefreshCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const input = forgotPasswordSchema.parse(req.body);
    const data = await authService.forgotPassword(input.email);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const input = resetPasswordSchema.parse(req.body);
    const data = await authService.resetPassword(input);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await authService.me(req.user!.userId);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
