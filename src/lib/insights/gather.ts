/**
 * Queries the database into the rule engine's input snapshots.
 * Kept separate from rules.ts so the rules stay pure and testable.
 */
import { prisma } from "../db";
import { INSIGHT_CONFIG as C } from "./config";
import type { InsightInputs } from "./rules";

const DAY = 24 * 60 * 60 * 1000;

/** Orders that count toward revenue/sales (money actually in play). */
const COUNTED = { notIn: ["CANCELLED", "PENDING_PAYMENT"] };

export async function gatherInsightInputs(now = new Date()): Promise<InsightInputs> {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last7Start = new Date(startOfToday.getTime() - 6 * DAY);
  const prior7Start = new Date(startOfToday.getTime() - 13 * DAY);
  const failureWindowStart = new Date(now.getTime() - C.failureWindowHours * 3600 * 1000);

  const [products, failedPayments, revCurrent, revPrevious, itemsLast7, itemsPrior7, refundsLast7, refundsPrior7] =
    await Promise.all([
      prisma.product.findMany(),
      prisma.payment.findMany({
        where: { status: "FAILED", createdAt: { gte: failureWindowStart } },
        select: { failureReason: true },
      }),
      prisma.order.aggregate({
        _sum: { totalOre: true },
        where: { status: COUNTED, createdAt: { gte: last7Start } },
      }),
      prisma.order.aggregate({
        _sum: { totalOre: true },
        where: { status: COUNTED, createdAt: { gte: prior7Start, lt: last7Start } },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        where: { order: { status: COUNTED, createdAt: { gte: last7Start } } },
      }),
      prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
        where: { order: { status: COUNTED, createdAt: { gte: prior7Start, lt: last7Start } } },
      }),
      prisma.order.findMany({
        where: { status: "REFUNDED", createdAt: { gte: last7Start } },
        include: { items: { include: { product: true } } },
      }),
      prisma.order.count({
        where: { status: "REFUNDED", createdAt: { gte: prior7Start, lt: last7Start } },
      }),
    ]);

  const soldLast7 = new Map(itemsLast7.map((g) => [g.productId, g._sum.quantity ?? 0]));
  const soldPrior7 = new Map(itemsPrior7.map((g) => [g.productId, g._sum.quantity ?? 0]));

  // Refund concentration: which product appears in the most refunded orders?
  const refundCounts = new Map<string, { name: string; count: number }>();
  for (const order of refundsLast7) {
    for (const item of order.items) {
      const entry = refundCounts.get(item.productId) ?? { name: item.product.name, count: 0 };
      entry.count++;
      refundCounts.set(item.productId, entry);
    }
  }
  let topProductId: string | null = null;
  let topProductName: string | null = null;
  let topProductCount = 0;
  for (const [id, { name, count }] of refundCounts) {
    if (count > topProductCount) {
      topProductId = id;
      topProductName = name;
      topProductCount = count;
    }
  }

  return {
    stock: products.map((p) => ({
      id: p.id,
      name: p.name,
      stockQuantity: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      soldLast7: soldLast7.get(p.id) ?? 0,
    })),
    failures: {
      failedInWindow: failedPayments.length,
      windowHours: C.failureWindowHours,
      reasons: [...new Set(failedPayments.map((p) => p.failureReason ?? "unknown"))],
    },
    revenue: {
      current: revCurrent._sum.totalOre ?? 0,
      previous: revPrevious._sum.totalOre ?? 0,
    },
    sellers: products.map((p) => ({
      id: p.id,
      name: p.name,
      unitsLast7: soldLast7.get(p.id) ?? 0,
      unitsPrior7: soldPrior7.get(p.id) ?? 0,
    })),
    refunds: {
      current: refundsLast7.length,
      previous: refundsPrior7,
      topProductId,
      topProductName,
      topProductCount,
    },
  };
}
