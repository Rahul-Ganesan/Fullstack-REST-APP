import { Router } from "express";
import rateLimit from "express-rate-limit";

import { requireAuth } from "../../middleware/auth";
import * as controller from "./auth.controller";

const authRouter = Router();
const loginLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login attempts. Try again later." },
});

authRouter.post("/register", controller.register);
authRouter.post("/login", loginLimiter, controller.login);
authRouter.post("/refresh", controller.refresh);
authRouter.post("/logout", controller.logout);
authRouter.post("/forgot-password", controller.forgotPassword);
authRouter.post("/reset-password", controller.resetPassword);
authRouter.get("/me", requireAuth, controller.me);

export { authRouter };
