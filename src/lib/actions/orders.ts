"use server";

import { prisma } from "../db";
import { ALLOWED_TRANSITIONS, type OrderStatus } from "../domain";
import type { ActionResult } from "./result";

export async function updateOrderStatus(
  orderId: string,
  nextStatus: OrderStatus,
): Promise<ActionResult<{ id: string; status: string }>> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { ok: false, error: "Order not found." };

  const allowed = ALLOWED_TRANSITIONS[order.status as OrderStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    return { ok: false, error: `Cannot move an order from ${order.status} to ${nextStatus}.` };
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: nextStatus,
      events: {
        create: {
          type: "STATUS_CHANGED",
          description: `Status changed to ${nextStatus}`,
        },
      },
    },
  });
  return { ok: true, data: { id: updated.id, status: updated.status } };
}
