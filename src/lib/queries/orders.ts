/** Order read queries — routed through the shared prisma client (src/lib/db.ts). */
import { prisma } from "../db";

export async function listOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderDetail(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      items: { include: { product: true } },
      payment: true,
      events: { orderBy: { createdAt: "asc" } },
    },
  });
}
