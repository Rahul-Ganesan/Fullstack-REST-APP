import { Prisma } from "@prisma/client";

import { prisma } from "../../db/prisma";
import { ApiError } from "../../utils/http";

interface ListQuery {
  page: number;
  limit: number;
  sortBy: "createdAt" | "name" | "email" | "country" | "lifecycleStage";
  sortDir: "asc" | "desc";
  country?: string;
  lifecycleStage?: string;
  createdFrom?: string;
  createdTo?: string;
}

export async function listCustomers(query: ListQuery) {
  const where: Prisma.CustomerWhereInput = {
    country: query.country,
    lifecycleStage: query.lifecycleStage,
    createdAt:
      query.createdFrom || query.createdTo
        ? {
            gte: query.createdFrom ? new Date(query.createdFrom) : undefined,
            lte: query.createdTo ? new Date(query.createdTo) : undefined,
          }
        : undefined,
  };

  const [items, total] = await prisma.$transaction([
    prisma.customer.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: { [query.sortBy]: query.sortDir },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    items,
    page: query.page,
    limit: query.limit,
    total,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function getCustomer(id: number) {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    throw new ApiError({ status: 404, message: "Customer not found" });
  }
  return customer;
}

export async function createCustomer(input: {
  externalId?: string | null;
  name: string;
  email: string;
  country: string;
  lifecycleStage: string;
}) {
  return prisma.customer.create({ data: input });
}

export async function updateCustomer(
  id: number,
  input: Partial<{
    externalId: string | null;
    name: string;
    email: string;
    country: string;
    lifecycleStage: string;
  }>,
) {
  await getCustomer(id);
  return prisma.customer.update({ where: { id }, data: input });
}

export async function deleteCustomer(id: number) {
  await getCustomer(id);
  await prisma.customer.delete({ where: { id } });
}
