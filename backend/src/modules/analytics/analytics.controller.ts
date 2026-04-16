import { NextFunction, Request, Response } from "express";

import { analyticsQuerySchema, segmentQuerySchema } from "./analytics.schema";
import * as analyticsService from "./analytics.service";

export async function getKpis(req: Request, res: Response, next: NextFunction) {
  try {
    const query = analyticsQuerySchema.parse(req.query);
    const data = await analyticsService.getKpis(query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}

export async function getSegments(req: Request, res: Response, next: NextFunction) {
  try {
    const query = segmentQuerySchema.parse(req.query);
    const data = await analyticsService.getSegments(query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
}
