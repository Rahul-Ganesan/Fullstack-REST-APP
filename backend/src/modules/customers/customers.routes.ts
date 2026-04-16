import { Router } from "express";

import { requireAuth, requireRole } from "../../middleware/auth";
import * as controller from "./customers.controller";

const customersRouter = Router();

customersRouter.use(requireAuth);
customersRouter.get("/", requireRole(["admin", "analyst"]), controller.listCustomers);
customersRouter.get("/:id", requireRole(["admin", "analyst"]), controller.getCustomer);
customersRouter.post("/", requireRole(["admin"]), controller.createCustomer);
customersRouter.patch("/:id", requireRole(["admin"]), controller.updateCustomer);
customersRouter.delete("/:id", requireRole(["admin"]), controller.deleteCustomer);

export { customersRouter };
