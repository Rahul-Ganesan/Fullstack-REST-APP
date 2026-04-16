import { Router } from "express";

import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./users.controller";

const usersRouter = Router();

usersRouter.use(requireAuth, requireRole(["admin"]));
usersRouter.get("/", controller.listUsers);
usersRouter.post("/invite", controller.inviteUser);
usersRouter.patch("/:id/status", controller.updateUserStatus);
usersRouter.post("/:id/reset-password", controller.resetUserPassword);

export { usersRouter };
