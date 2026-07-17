/**
 * Write-path seam #1 (PRD.md §Testing Decisions, "secondary seam"):
 * updating an order status persists and appends the correct timeline event;
 * invalid transitions are rejected. Tested against the real dev Supabase
 * database (see tests/helpers/fixtures.ts) — no mocking of Prisma.
 */
import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "../src/lib/db";
import { createTestOrder, deleteTestOrder } from "./helpers/fixtures";
import { updateOrderStatus } from "../src/lib/actions/orders";

const cleanup: string[] = [];
afterEach(async () => {
  while (cleanup.length) await deleteTestOrder(cleanup.pop()!);
});

describe("updateOrderStatus — legal transition", () => {
  it("persists the new status when the transition is legal (PAID -> FULFILLED)", async () => {
    const order = await createTestOrder("PAID");
    cleanup.push(order.id);

    const result = await updateOrderStatus(order.id, "FULFILLED");
    assert.equal(result.ok, true);

    const reloaded = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(reloaded.status, "FULFILLED");
  });
});

describe("updateOrderStatus — timeline (PRD user story 15: 'a status change to appear in the order's timeline')", () => {
  it("appends an OrderEvent recording the new status on a legal transition", async () => {
    const order = await createTestOrder("PAID");
    cleanup.push(order.id);

    await updateOrderStatus(order.id, "FULFILLED");

    const events = await prisma.orderEvent.findMany({ where: { orderId: order.id } });
    assert.equal(events.length, 1);
    assert.equal(events[0].type, "STATUS_CHANGED");
    assert.match(events[0].description, /FULFILLED/);
  });

  it("does not append an event when the transition is rejected", async () => {
    const order = await createTestOrder("DELIVERED");
    cleanup.push(order.id);

    await updateOrderStatus(order.id, "PAID"); // illegal, per ALLOWED_TRANSITIONS

    const events = await prisma.orderEvent.findMany({ where: { orderId: order.id } });
    assert.deepEqual(events, []);
  });
});

describe("updateOrderStatus — illegal transition (PRD: 'invalid transitions are rejected')", () => {
  it("rejects a transition not in ALLOWED_TRANSITIONS, and leaves status unchanged", async () => {
    // DELIVERED's only allowed next state is REFUNDED (src/lib/domain.ts).
    const order = await createTestOrder("DELIVERED");
    cleanup.push(order.id);

    const result = await updateOrderStatus(order.id, "PAID");
    assert.equal(result.ok, false);

    const reloaded = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(reloaded.status, "DELIVERED");
  });

  it("rejects any transition from a terminal state (REFUNDED has no allowed next states)", async () => {
    const order = await createTestOrder("REFUNDED");
    cleanup.push(order.id);

    const result = await updateOrderStatus(order.id, "CANCELLED");
    assert.equal(result.ok, false);
  });

  it("rejects setting a status to itself (a status is never its own listed transition)", async () => {
    const order = await createTestOrder("PAID");
    cleanup.push(order.id);

    const result = await updateOrderStatus(order.id, "PAID");
    assert.equal(result.ok, false);
  });

  it("rejects an unknown order id without throwing", async () => {
    await assert.doesNotReject(async () => {
      const result = await updateOrderStatus("does-not-exist", "PAID");
      assert.equal(result.ok, false);
    });
  });
});
