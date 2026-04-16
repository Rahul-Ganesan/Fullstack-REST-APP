import { z } from "zod";

export const analyticsQuerySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  country: z.string().min(2).optional(),
  lifecycleStage: z.string().min(2).optional(),
});

export const segmentQuerySchema = analyticsQuerySchema.extend({
  minRevenue: z.coerce.number().min(0).default(0),
  eventType: z.string().min(2).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
