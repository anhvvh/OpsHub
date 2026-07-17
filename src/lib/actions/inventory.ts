"use server";

import { prisma } from "../db";
import type { ActionResult } from "./result";

export async function adjustStock(
  productId: string,
  newQuantity: number,
): Promise<ActionResult<{ id: string; stockQuantity: number; lowStockThreshold: number }>> {
  if (!Number.isInteger(newQuantity) || newQuantity < 0) {
    return { ok: false, error: "Stock quantity must be a whole number that is zero or greater." };
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { ok: false, error: "Product not found." };

  const updated = await prisma.product.update({
    where: { id: productId },
    data: { stockQuantity: newQuantity },
  });
  return {
    ok: true,
    data: { id: updated.id, stockQuantity: updated.stockQuantity, lowStockThreshold: updated.lowStockThreshold },
  };
}
