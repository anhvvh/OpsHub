/**
 * Write-path seam #2 (PRD.md §Testing Decisions, "secondary seam"):
 * adjusting stock persists and flips the low-stock evaluation in the same
 * request cycle; invalid values are rejected. Tested against the real dev
 * Supabase database (see tests/helpers/fixtures.ts) — no mocking of Prisma.
 */
import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/db";
import { createTestProduct, deleteTestProduct } from "./helpers/fixtures";
import { adjustStock } from "../src/lib/actions/inventory";

const cleanup: string[] = [];
afterEach(async () => {
  while (cleanup.length) await deleteTestProduct(cleanup.pop()!);
});

describe("adjustStock — valid write", () => {
  it("persists the new quantity, immediately reflecting the low-stock evaluation (PRD user story 21)", async () => {
    const product = await createTestProduct(20, 10); // healthy: 20 >= 10
    cleanup.push(product.id);

    const result = await adjustStock(product.id, 5); // now below threshold
    assert.equal(result.ok, true);

    const reloaded = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    assert.equal(reloaded.stockQuantity, 5);
    assert.ok(reloaded.stockQuantity < reloaded.lowStockThreshold, "expected the reloaded row to read as low stock");
  });

  it("zero is a valid quantity (sold out is a legitimate state, not an error)", async () => {
    const product = await createTestProduct(5, 10);
    cleanup.push(product.id);

    const result = await adjustStock(product.id, 0);
    assert.equal(result.ok, true);

    const reloaded = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    assert.equal(reloaded.stockQuantity, 0);
  });
});

describe("adjustStock — invalid values are rejected (PRD §Testing Decisions)", () => {
  it("rejects a negative quantity, leaving stock unchanged", async () => {
    const product = await createTestProduct(20, 10);
    cleanup.push(product.id);

    const result = await adjustStock(product.id, -1);
    assert.equal(result.ok, false);

    const reloaded = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    assert.equal(reloaded.stockQuantity, 20);
  });

  it("rejects a non-integer quantity, leaving stock unchanged", async () => {
    const product = await createTestProduct(20, 10);
    cleanup.push(product.id);

    const result = await adjustStock(product.id, 4.5);
    assert.equal(result.ok, false);

    const reloaded = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });
    assert.equal(reloaded.stockQuantity, 20);
  });

  it("rejects an unknown product id without throwing", async () => {
    await assert.doesNotReject(async () => {
      const result = await adjustStock("does-not-exist", 5);
      assert.equal(result.ok, false);
    });
  });
});
