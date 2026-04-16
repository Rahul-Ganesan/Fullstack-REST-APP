import "dotenv/config";

import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Prisma } from "@prisma/client";

import { prisma } from "../src/db/prisma";

interface BenchmarkStats {
  avgMs: number;
  p95Ms: number;
  minMs: number;
  maxMs: number;
  samples: number[];
}

interface BenchmarkReport {
  generatedAt: string;
  queryWindow: {
    from: string;
    to: string;
  };
  iterations: number;
  naive: BenchmarkStats;
  optimized: BenchmarkStats;
  improvementPercent: number;
  claimMet: boolean;
}

const ITERATIONS = 25;
const WARMUP = 5;
const from = new Date("2026-01-01T00:00:00.000Z");
const to = new Date();

function nowMs(): number {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

function summarize(samples: number[]): BenchmarkStats {
  const sorted = [...samples].sort((a, b) => a - b);
  const avgMs = sorted.reduce((acc, value) => acc + value, 0) / sorted.length;
  const p95Index = Math.max(0, Math.ceil(sorted.length * 0.95) - 1);
  return {
    avgMs,
    p95Ms: sorted[p95Index],
    minMs: sorted[0],
    maxMs: sorted[sorted.length - 1],
    samples: sorted,
  };
}

async function runNaiveQuery() {
  return prisma.$queryRaw(Prisma.sql`
    SELECT
      (
        SELECT COUNT(*)
        FROM customers c
        WHERE c.created_at BETWEEN ${from} AND ${to}
      ) AS totalCustomers,
      (
        SELECT COUNT(DISTINCT o.customer_id)
        FROM orders o
        INNER JOIN customers c ON c.id = o.customer_id
        WHERE c.created_at BETWEEN ${from} AND ${to}
          AND o.ordered_at BETWEEN ${from} AND ${to}
          AND o.amount > 0
      ) AS activeCustomers,
      (
        SELECT SUM(o.amount)
        FROM orders o
        INNER JOIN customers c ON c.id = o.customer_id
        WHERE c.created_at BETWEEN ${from} AND ${to}
          AND o.ordered_at BETWEEN ${from} AND ${to}
      ) AS totalRevenue,
      (
        SELECT AVG(inner_orders.avg_order)
        FROM (
          SELECT AVG(o.amount) AS avg_order
          FROM orders o
          INNER JOIN customers c ON c.id = o.customer_id
          WHERE c.created_at BETWEEN ${from} AND ${to}
            AND o.ordered_at BETWEEN ${from} AND ${to}
          GROUP BY o.customer_id
        ) inner_orders
      ) AS avgOrderValue
  `);
}

async function runOptimizedQuery() {
  return prisma.$queryRaw(Prisma.sql`
    WITH filtered_customers AS (
      SELECT c.id
      FROM customers c
      WHERE c.created_at BETWEEN ${from} AND ${to}
    ),
    order_agg AS (
      SELECT o.customer_id,
             SUM(o.amount) AS total_revenue,
             AVG(o.amount) AS avg_order
      FROM orders o
      INNER JOIN filtered_customers fc ON fc.id = o.customer_id
      WHERE o.ordered_at BETWEEN ${from} AND ${to}
      GROUP BY o.customer_id
    )
    SELECT
      (SELECT COUNT(*) FROM filtered_customers) AS totalCustomers,
      (SELECT COUNT(*) FROM order_agg WHERE total_revenue > 0) AS activeCustomers,
      (SELECT SUM(total_revenue) FROM order_agg) AS totalRevenue,
      (SELECT AVG(avg_order) FROM order_agg) AS avgOrderValue
  `);
}

async function measure(fn: () => Promise<unknown>): Promise<number> {
  const started = nowMs();
  await fn();
  return nowMs() - started;
}

async function runSeries(fn: () => Promise<unknown>): Promise<number[]> {
  for (let i = 0; i < WARMUP; i += 1) {
    await fn();
  }
  const samples: number[] = [];
  for (let i = 0; i < ITERATIONS; i += 1) {
    samples.push(await measure(fn));
  }
  return samples;
}

async function main() {
  await prisma.$connect();

  const naiveSamples = await runSeries(runNaiveQuery);
  const optimizedSamples = await runSeries(runOptimizedQuery);

  const naive = summarize(naiveSamples);
  const optimized = summarize(optimizedSamples);
  const improvementPercent = ((naive.avgMs - optimized.avgMs) / naive.avgMs) * 100;

  const report: BenchmarkReport = {
    generatedAt: new Date().toISOString(),
    queryWindow: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    iterations: ITERATIONS,
    naive,
    optimized,
    improvementPercent,
    claimMet: improvementPercent >= 40,
  };

  const outputDir = resolve(process.cwd(), "outputs", "perf");
  await mkdir(outputDir, { recursive: true });
  const outputPath = resolve(outputDir, "latency-report.json");
  await writeFile(outputPath, JSON.stringify(report, null, 2), "utf8");

  console.log(`Naive avg: ${naive.avgMs.toFixed(2)}ms`);
  console.log(`Optimized avg: ${optimized.avgMs.toFixed(2)}ms`);
  console.log(`Improvement: ${improvementPercent.toFixed(2)}%`);
  console.log(`40% claim met: ${report.claimMet ? "YES" : "NO"}`);
  console.log(`Report written to: ${outputPath}`);
}

main()
  .catch((error) => {
    console.error("Benchmark failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
