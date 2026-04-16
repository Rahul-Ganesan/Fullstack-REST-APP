import { Router } from "express";

import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./analytics.controller";

const analyticsRouter = Router();

analyticsRouter.use(requireAuth);
analyticsRouter.get("/kpis", requireRole(["admin", "analyst"]), controller.getKpis);
analyticsRouter.get("/segments", requireRole(["admin", "analyst"]), controller.getSegments);

export { analyticsRouter };
