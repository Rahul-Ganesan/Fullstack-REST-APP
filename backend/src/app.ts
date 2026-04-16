import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { analyticsRouter } from "./modules/analytics/analytics.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { customersRouter } from "./modules/customers/customers.routes";
import { usersRouter } from "./modules/users/users.routes";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((value) => value.trim()),
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/customers", customersRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/users", usersRouter);

app.use(notFoundHandler);
app.use(errorHandler);
