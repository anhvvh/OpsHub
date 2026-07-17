/**
 * Dashboard read queries — the single place the "/" screen touches the
 * database. Routes through the shared prisma client (src/lib/db.ts) and the
 * already-tested insight pipeline (src/lib/insights/*), never a second
 * connection or a duplicated rule.
 */
import { prisma } from "../db";
import { gatherInsightInputs } from "../insights/gather";
import { computeInsights } from "../insights/rules";
import { phraseInsights, type PhrasedInsight } from "../insights/phrase";

const DAY = 24 * 60 * 60 * 1000;
/** Orders that count toward revenue/order-volume trends (money actually in play). */
const COUNTED = { notIn: ["CANCELLED", "PENDING_PAYMENT"] };

export interface DashboardData {
  revenueTodayOre: number;
  revenueDeltaPct: number;
  ordersToday: number;
  ordersDelta: number;
  pendingPayments: number;
  pendingPaymentsOre: number;
  openRefunds: number;
  openRefundsDelta: number;
  revenueSparks: number[];
  ordersSparks: number[];
  insights: PhrasedInsight[];
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Scale a week of daily values to 0-100 for the sparkline bars, with a floor so a zero day still shows a sliver. */
function normalizeSpark(values: number[]): number[] {
  const max = Math.max(...values, 1);
  return values.map((v) => Math.max(8, Math.round((v / max) * 100)));
}

export async function getDashboardData(now = new Date()): Promise<DashboardData> {
  const today = startOfDay(now);
  const yesterday = new Date(today.getTime() - DAY);
  const last7Start = new Date(today.getTime() - 6 * DAY);
  const prior7Start = new Date(today.getTime() - 13 * DAY);

  const [
    revenueToday,
    revenueYesterday,
    ordersTodayCount,
    ordersYesterdayCount,
    pendingAgg,
    refundsLast7,
    refundsPrior7,
    revenueRows,
    orderRows,
    insightInputs,
  ] = await Promise.all([
    prisma.order.aggregate({ _sum: { totalOre: true }, where: { status: COUNTED, createdAt: { gte: today } } }),
    prisma.order.aggregate({ _sum: { totalOre: true }, where: { status: COUNTED, createdAt: { gte: yesterday, lt: today } } }),
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
    prisma.payment.aggregate({ _count: true, _sum: { amountOre: true }, where: { status: "PENDING" } }),
    prisma.order.count({ where: { status: "REFUNDED", updatedAt: { gte: last7Start } } }),
    prisma.order.count({ where: { status: "REFUNDED", updatedAt: { gte: prior7Start, lt: last7Start } } }),
    prisma.order.findMany({
      where: { status: COUNTED, createdAt: { gte: last7Start } },
      select: { totalOre: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { createdAt: { gte: last7Start } },
      select: { createdAt: true },
    }),
    gatherInsightInputs(now),
  ]);

  const revenueByDay = Array<number>(7).fill(0);
  for (const o of revenueRows) {
    const dayIndex = Math.floor((startOfDay(o.createdAt).getTime() - last7Start.getTime()) / DAY);
    if (dayIndex >= 0 && dayIndex < 7) revenueByDay[dayIndex] += o.totalOre;
  }
  const ordersByDay = Array<number>(7).fill(0);
  for (const o of orderRows) {
    const dayIndex = Math.floor((startOfDay(o.createdAt).getTime() - last7Start.getTime()) / DAY);
    if (dayIndex >= 0 && dayIndex < 7) ordersByDay[dayIndex] += 1;
  }

  const revToday = revenueToday._sum.totalOre ?? 0;
  const revYesterday = revenueYesterday._sum.totalOre ?? 0;
  const revenueDeltaPct = revYesterday > 0 ? Math.round((revToday / revYesterday - 1) * 1000) / 10 : 0;

  const rawInsights = computeInsights(insightInputs);
  const insights = await phraseInsights(rawInsights);

  return {
    revenueTodayOre: revToday,
    revenueDeltaPct,
    ordersToday: ordersTodayCount,
    ordersDelta: ordersTodayCount - ordersYesterdayCount,
    pendingPayments: pendingAgg._count,
    pendingPaymentsOre: pendingAgg._sum.amountOre ?? 0,
    openRefunds: refundsLast7,
    openRefundsDelta: refundsLast7 - refundsPrior7,
    revenueSparks: normalizeSpark(revenueByDay),
    ordersSparks: normalizeSpark(ordersByDay),
    insights,
  };
}
