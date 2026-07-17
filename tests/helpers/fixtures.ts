/**
 * Test fixtures for the write-path seam (PRD.md §Testing Decisions,
 * "secondary seam"). These hit the real dev Supabase Postgres database via
 * Prisma — there is no separate test database — so every row created here
 * is uniquely prefixed "TEST-" and torn down by the caller (via afterEach),
 * so runs never touch or collide with the seeded Hälsa Skincare demo data.
 */
import { prisma } from "../../src/lib/db";
import type { OrderStatus } from "../../src/lib/domain";

const rid = () => Math.random().toString(36).slice(2, 10);

export async function createTestOrder(status: OrderStatus) {
  return prisma.order.create({
    data: {
      orderNumber: `TEST-${rid()}`,
      customerName: "Test Customer",
      customerEmail: "test@example.com",
      shippingAddress: "Testgatan 1\n123 45 Testville, Sweden",
      channel: "SHOPIFY",
      status,
      totalOre: 10000,
    },
  });
}

export async function deleteTestOrder(orderId: string) {
  await prisma.orderEvent.deleteMany({ where: { orderId } });
  await prisma.order.delete({ where: { id: orderId } }).catch(() => {});
}

export async function createTestProduct(stockQuantity: number, lowStockThreshold = 10) {
  return prisma.product.create({
    data: {
      sku: `TEST-${rid()}`,
      name: "Test Product",
      category: "Test",
      priceOre: 10000,
      stockQuantity,
      lowStockThreshold,
    },
  });
}

export async function deleteTestProduct(productId: string) {
  await prisma.product.delete({ where: { id: productId } }).catch(() => {});
}
