import { Prisma } from "@prisma/client";

import { prisma } from "../../db/prisma";

interface AnalyticsQuery {
  from: string;
  to: string;
  country?: string;
  lifecycleStage?: string;
}

interface SegmentQuery extends AnalyticsQuery {
  minRevenue: number;
  eventType?: string;
  page: number;
  limit: number;
}

function buildCustomerFilter(query: AnalyticsQuery) {
  return Prisma.sql`
    c.created_at BETWEEN ${new Date(query.from)} AND ${new Date(query.to)}
    ${query.country ? Prisma.sql`AND c.country = ${query.country}` : Prisma.empty}
    ${query.lifecycleStage ? Prisma.sql`AND c.lifecycle_stage = ${query.lifecycleStage}` : Prisma.empty}
  `;
}

export async function getKpis(query: AnalyticsQuery) {
  const customerFilter = buildCustomerFilter(query);

  const result = await prisma.$queryRaw<
    Array<{
      totalCustomers: bigint;
      activeCustomers: bigint;
      totalRevenue: Prisma.Decimal | null;
      avgOrderValue: Prisma.Decimal | null;
    }>
  >(Prisma.sql`
    WITH filtered_customers AS (
      SELECT c.id
      FROM customers c
      WHERE ${customerFilter}
    ),
    order_agg AS (
      SELECT o.customer_id,
             SUM(o.amount) AS total_revenue,
             AVG(o.amount) AS avg_order
      FROM orders o
      INNER JOIN filtered_customers fc ON fc.id = o.customer_id
      WHERE o.ordered_at BETWEEN ${new Date(query.from)} AND ${new Date(query.to)}
      GROUP BY o.customer_id
    )
    SELECT
      (SELECT COUNT(*) FROM filtered_customers) AS totalCustomers,
      (SELECT COUNT(*) FROM order_agg WHERE total_revenue > 0) AS activeCustomers,
      (SELECT SUM(total_revenue) FROM order_agg) AS totalRevenue,
      (SELECT AVG(avg_order) FROM order_agg) AS avgOrderValue
  `);

  const first = result[0];
  return {
    totalCustomers: Number(first?.totalCustomers ?? 0),
    activeCustomers: Number(first?.activeCustomers ?? 0),
    totalRevenue: Number(first?.totalRevenue ?? 0),
    avgOrderValue: Number(first?.avgOrderValue ?? 0),
  };
}

export async function getSegments(query: SegmentQuery) {
  const offset = (query.page - 1) * query.limit;
  const customerFilter = buildCustomerFilter(query);

  const rows = await prisma.$queryRaw<
    Array<{
      customerId: number;
      name: string;
      email: string;
      country: string;
      lifecycleStage: string;
      revenue: Prisma.Decimal;
      eventsCount: bigint;
    }>
  >(Prisma.sql`
    WITH filtered_customers AS (
      SELECT c.id, c.name, c.email, c.country, c.lifecycle_stage
      FROM customers c
      WHERE ${customerFilter}
    ),
    customer_metrics AS (
      SELECT
        fc.id AS customerId,
        fc.name,
        fc.email,
        fc.country,
        fc.lifecycle_stage AS lifecycleStage,
        COALESCE(SUM(o.amount), 0) AS revenue,
        COUNT(e.id) AS eventsCount
      FROM filtered_customers fc
      LEFT JOIN orders o ON o.customer_id = fc.id
        AND o.ordered_at BETWEEN ${new Date(query.from)} AND ${new Date(query.to)}
      LEFT JOIN events e ON e.customer_id = fc.id
        AND e.occurred_at BETWEEN ${new Date(query.from)} AND ${new Date(query.to)}
        ${query.eventType ? Prisma.sql`AND e.event_type = ${query.eventType}` : Prisma.empty}
      GROUP BY fc.id, fc.name, fc.email, fc.country, fc.lifecycle_stage
    )
    SELECT *
    FROM customer_metrics
    WHERE revenue >= ${query.minRevenue}
    ORDER BY revenue DESC
    LIMIT ${query.limit}
    OFFSET ${offset}
  `);

  return {
    items: rows.map((row) => ({
      ...row,
      revenue: Number(row.revenue),
      eventsCount: Number(row.eventsCount),
    })),
    page: query.page,
    limit: query.limit,
  };
}
