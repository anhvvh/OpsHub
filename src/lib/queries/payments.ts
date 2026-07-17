/** Payment read queries — routed through the shared prisma client (src/lib/db.ts). */
import { prisma } from "../db";
import type { PaymentStatus } from "../domain";

export async function listPayments() {
  return prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: { order: { select: { orderNumber: true } } },
  });
}

export interface PaymentSummary {
  settledOre: number;
  succeeded: { count: number; amountOre: number };
  pending: { count: number; amountOre: number };
  failed: { count: number; amountOre: number };
  refunded: { count: number; amountOre: number };
  failedInLast24h: number;
  failedReasonsLast24h: string[];
}

const DAY = 24 * 60 * 60 * 1000;

export async function getPaymentSummary(now = new Date()): Promise<PaymentSummary> {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last24hStart = new Date(now.getTime() - DAY);

  const byStatus = async (status: PaymentStatus, createdToday: boolean) =>
    prisma.payment.aggregate({
      _count: true,
      _sum: { amountOre: true },
      where: { status, ...(createdToday ? { createdAt: { gte: startOfToday } } : {}) },
    });

  const [succeededToday, pending, failed, refunded, failedLast24h, failedLast24hRows] = await Promise.all([
    byStatus("SUCCEEDED", true),
    byStatus("PENDING", false),
    byStatus("FAILED", false),
    byStatus("REFUNDED", false),
    prisma.payment.count({ where: { status: "FAILED", createdAt: { gte: last24hStart } } }),
    prisma.payment.findMany({
      where: { status: "FAILED", createdAt: { gte: last24hStart } },
      select: { failureReason: true },
    }),
  ]);

  return {
    settledOre: succeededToday._sum.amountOre ?? 0,
    succeeded: { count: succeededToday._count, amountOre: succeededToday._sum.amountOre ?? 0 },
    pending: { count: pending._count, amountOre: pending._sum.amountOre ?? 0 },
    failed: { count: failed._count, amountOre: failed._sum.amountOre ?? 0 },
    refunded: { count: refunded._count, amountOre: refunded._sum.amountOre ?? 0 },
    failedInLast24h: failedLast24h,
    failedReasonsLast24h: [...new Set(failedLast24hRows.map((r) => r.failureReason ?? "unknown"))],
  };
}
