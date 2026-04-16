import { z } from "zod";

export const customerListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "name", "email", "country", "lifecycleStage"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  country: z.string().min(2).optional(),
  lifecycleStage: z.string().min(2).optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
});

export const createCustomerSchema = z.object({
  externalId: z.string().min(1).optional().nullable(),
  name: z.string().min(2),
  email: z.string().email(),
  country: z.string().min(2),
  lifecycleStage: z.string().min(2),
});

export const updateCustomerSchema = createCustomerSchema.partial();
