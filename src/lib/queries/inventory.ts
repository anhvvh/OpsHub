/** Inventory read queries — routed through the shared prisma client (src/lib/db.ts). */
import { prisma } from "../db";

const DAY = 24 * 60 * 60 * 1000;
const COUNTED = { notIn: ["CANCELLED", "PENDING_PAYMENT"] };

export async function listProducts() {
  return prisma.product.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getProductDetail(sku: string) {
  const product = await prisma.product.findUnique({ where: { sku } });
  if (!product) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const last14Start = new Date(startOfToday.getTime() - 13 * DAY);
  const last7Start = new Date(startOfToday.getTime() - 6 * DAY);

  const [items14, itemsThisWeek] = await Promise.all([
    prisma.orderItem.findMany({
      where: { productId: product.id, order: { status: COUNTED, createdAt: { gte: last14Start } } },
      select: { quantity: true, order: { select: { createdAt: true } } },
    }),
    prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: { productId: product.id, order: { status: COUNTED, createdAt: { gte: last7Start } } },
    }),
  ]);

  const sold14 = Array<number>(14).fill(0);
  for (const item of items14) {
    const dayIndex = Math.floor((item.order.createdAt.getTime() - last14Start.getTime()) / DAY);
    if (dayIndex >= 0 && dayIndex < 14) sold14[dayIndex] += item.quantity;
  }

  return {
    product,
    sold14,
    soldThisWeek: itemsThisWeek._sum.quantity ?? 0,
  };
}
