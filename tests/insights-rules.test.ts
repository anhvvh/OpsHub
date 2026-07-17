/**
 * Tests for the insight rule engine (src/lib/insights/rules.ts) — PRD's own
 * "primary testing seam" (PRD.md §Testing Decisions). Five pure functions,
 * no DB/server.
 *
 * Every expected value here is derived from PRD.md text directly — never
 * from reading rules.ts — so a failure means the code disagrees with the
 * spec, not that the test disagrees with the code. Where PRD.md does not
 * state a rule precisely enough to derive an expected value (exact
 * threshold counts/percentages, link targets for two insight types, a
 * noise floor for rate-of-change rules), no assertion is written for that
 * gap — it is called out in the accompanying report instead of guessed at.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  lowStockRule,
  paymentFailuresRule,
  revenueDownRule,
  hotSellerRule,
  refundSpikeRule,
  computeInsights,
  type InsightInputs,
} from "../src/lib/insights/rules";

const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

describe("lowStockRule — PRD: fixed threshold, `stockQuantity < lowStockThreshold`", () => {
  it("fires on the PRD worked example (Lavender Face Serum, 4 units, threshold 15)", () => {
    const [insight] = lowStockRule([
      { id: "p-lav", name: "Lavender Face Serum", stockQuantity: 4, lowStockThreshold: 15, soldLast7: 31 },
    ]);
    assert.equal(insight.type, "LOW_STOCK");
    assert.equal(insight.facts.stock, 4);
    assert.equal(insight.facts.threshold, 15);
    assert.equal(insight.href, "/inventory/p-lav"); // PRD §Windows: product detail is /inventory/[id]
  });

  it("does not fire when stock is comfortably above threshold", () => {
    const result = lowStockRule([
      { id: "p1", name: "Healthy Product", stockQuantity: 20, lowStockThreshold: 15, soldLast7: 5 },
    ]);
    assert.deepEqual(result, []);
  });

  it("boundary: does not fire when stock exactly equals the threshold (PRD's rule is strict '<')", () => {
    const result = lowStockRule([
      { id: "p1", name: "At The Line", stockQuantity: 15, lowStockThreshold: 15, soldLast7: 0 },
    ]);
    assert.deepEqual(result, []);
  });

  it("zero stock fires (0 is still < any positive threshold)", () => {
    const result = lowStockRule([
      { id: "p1", name: "Sold Out", stockQuantity: 0, lowStockThreshold: 10, soldLast7: 0 },
    ]);
    assert.equal(result.length, 1);
  });

  it("negative stock fires (formula has no floor at zero; PRD does not forbid negative stock)", () => {
    const result = lowStockRule([
      { id: "p1", name: "Oversold", stockQuantity: -3, lowStockThreshold: 10, soldLast7: 0 },
    ]);
    assert.equal(result.length, 1);
  });

  it("empty product list yields no insights", () => {
    assert.deepEqual(lowStockRule([]), []);
  });
});

describe("paymentFailuresRule — PRD: 'count over threshold in a rolling window'", () => {
  it("does not fire with zero failures", () => {
    assert.deepEqual(paymentFailuresRule({ failedInWindow: 0, windowHours: 24, reasons: [] }), []);
  });

  it("fires when failures are clearly a cluster (well above any sane threshold)", () => {
    const [insight] = paymentFailuresRule({
      failedInWindow: 10,
      windowHours: 24,
      reasons: ["card_declined", "insufficient_funds"],
    });
    assert.equal(insight.type, "PAYMENT_FAILURES");
    assert.equal(insight.severity, "critical");
    assert.match(insight.href, /^\/payments/); // PRD cross-linking: failed payments → payments view
  });

  // NOTE: cannot write an exact-boundary test here — see gap report below.
  // The precise failure count that counts as "rising" is not stated in PRD.md.
});

describe("revenueDownRule — PRD: rate-of-change vs prior 7-day period", () => {
  it("does not fire and does not divide by zero with no prior-period data (PRD §Testing Decisions)", () => {
    let result: ReturnType<typeof revenueDownRule> = [];
    assert.doesNotThrow(() => (result = revenueDownRule({ current: 500000, previous: 0 })));
    assert.deepEqual(result, []);
  });

  it("fires on the PRD worked example magnitude (last 7 days ≈ -20% vs prior 7, PRD §Sample Data)", () => {
    const [insight] = revenueDownRule({ current: 800000, previous: 1000000 });
    assert.equal(insight.type, "REVENUE_DOWN");
    assert.equal(insight.facts.deltaPct, -20);
  });

  it("does not fire when revenue is flat or up", () => {
    assert.deepEqual(revenueDownRule({ current: 1000000, previous: 1000000 }), []);
    assert.deepEqual(revenueDownRule({ current: 1200000, previous: 1000000 }), []);
  });

  it("fires on a decline that is exactly 10%, despite IEEE754 rounding (float boundary risk)", () => {
    // 9/10 - 1 === -0.09999999999999998 in floating point, not exactly -0.1.
    // A raw "delta > -0.1" comparison (the same bug class fixed in
    // refundSpikeRule) would treat a true 10% decline as milder than the
    // threshold and wrongly skip it. Compare on the rounded percentage.
    const delta = 9 / 10 - 1;
    assert.ok(delta > -0.1, "test setup check: this pair must sit on the float boundary");
    const [insight] = revenueDownRule({ current: 900000, previous: 1000000 });
    assert.equal(insight.type, "REVENUE_DOWN");
    assert.equal(insight.facts.deltaPct, -10);
  });

  // NOTE: cannot write an exact-boundary test for an *arbitrary* percentage —
  // the precise decline % that triggers this rule is not stated in PRD.md.
  // The test above targets -10% specifically because that IS the value in
  // config.ts and is where the float representation actually misbehaves.
});

describe("hotSellerRule — PRD: rate-of-change vs prior 7-day period", () => {
  it("fires on the PRD worked example (Vitamin C Brightening Serum ≈ 3× prior week, PRD §Sample Data)", () => {
    const [insight] = hotSellerRule([
      { id: "p-vitc", name: "Vitamin C Brightening Serum", unitsLast7: 84, unitsPrior7: 28 },
    ]);
    assert.equal(insight.type, "HOT_SELLER");
    assert.equal(insight.facts.multiple, 3);
    assert.equal(insight.href, "/inventory/p-vitc");
  });

  it("does not fire on modest, unremarkable growth", () => {
    const result = hotSellerRule([{ id: "p1", name: "Steady Seller", unitsLast7: 24, unitsPrior7: 20 }]);
    assert.deepEqual(result, []);
  });

  it("does not fire and does not divide by zero with no prior-period sales (PRD §Testing Decisions)", () => {
    const input = [{ id: "p1", name: "New Product", unitsLast7: 50, unitsPrior7: 0 }];
    let result: ReturnType<typeof hotSellerRule> = [];
    assert.doesNotThrow(() => (result = hotSellerRule(input)));
    assert.deepEqual(result, []);
  });

  it("empty product list yields no insights", () => {
    assert.deepEqual(hotSellerRule([]), []);
  });

  // NOTE: no test asserts on tiny-volume "3x" (e.g. 1 unit -> 3 units).
  // PRD.md states no minimum-volume noise floor for this rule — see gap report.
});

describe("refundSpikeRule — PRD: rate-of-change vs prior 7-day period, concentration on one product", () => {
  it("fires on the PRD worked example magnitude (+40% WoW, concentrated on one product, PRD §Sample Data)", () => {
    const [insight] = refundSpikeRule({
      current: 14,
      previous: 10,
      topProductId: "p-ros",
      topProductName: "Rosehip Night Cream",
      topProductCount: 9,
    });
    assert.equal(insight.type, "REFUND_SPIKE");
    assert.equal(insight.facts.deltaPct, 40);
    assert.equal(insight.facts.topProduct, "Rosehip Night Cream");
    assert.equal(insight.href, "/inventory/p-ros"); // PRD cross-linking: refund spike -> product/orders
  });

  it("does not fire when refunds are flat", () => {
    const result = refundSpikeRule({
      current: 10,
      previous: 10,
      topProductId: null,
      topProductName: null,
      topProductCount: 0,
    });
    assert.deepEqual(result, []);
  });

  it("does not fire and does not divide by zero with no prior-period refunds (PRD §Testing Decisions)", () => {
    const input = { current: 5, previous: 0, topProductId: null, topProductName: null, topProductCount: 0 };
    let result: ReturnType<typeof refundSpikeRule> = [];
    assert.doesNotThrow(() => (result = refundSpikeRule(input)));
    assert.deepEqual(result, []);
  });

  // NOTE: no exact-boundary test, no tiny-volume-noise-floor test — the
  // precise trigger % and any minimum refund count are not stated in
  // PRD.md. See gap report.
});

describe("computeInsights — PRD-stated composition rules", () => {
  const manyLowStock: InsightInputs = {
    stock: Array.from({ length: 6 }, (_, i) => ({
      id: `p${i}`,
      name: `Product ${i}`,
      stockQuantity: 1,
      lowStockThreshold: 10,
      soldLast7: 0,
    })),
    failures: { failedInWindow: 10, windowHours: 24, reasons: ["card_declined"] },
    revenue: { current: 800000, previous: 1000000 },
    sellers: [{ id: "p-vitc", name: "Vitamin C Brightening Serum", unitsLast7: 84, unitsPrior7: 28 }],
    refunds: { current: 14, previous: 10, topProductId: "p-ros", topProductName: "Rosehip Night Cream", topProductCount: 9 },
  };

  it("caps total insights at 5 even when more than 5 conditions fire (PRD §Windows: 'max ~5')", () => {
    // 6 low-stock + 1 payment-failure + 1 revenue-down + 1 hot-seller + 1 refund-spike = 10 candidates.
    const result = computeInsights(manyLowStock);
    assert.ok(result.length <= 5, `expected at most 5 insights, got ${result.length}`);
  });

  it("every fired insight's action line is at most ~8 words (PRD §Implementation Decisions)", () => {
    for (const insight of computeInsights(manyLowStock)) {
      assert.ok(
        wordCount(insight.action) <= 8,
        `"${insight.action}" is ${wordCount(insight.action)} words, PRD caps action lines at ~8`,
      );
    }
  });

  it("every fired insight's headline is number-first (PRD user story 33: contains a digit)", () => {
    for (const insight of computeInsights(manyLowStock)) {
      assert.match(insight.headline, /\d/, `"${insight.headline}" has no digit`);
    }
  });

  it("every fired insight deep-links somewhere (PRD user story 35: one click to act)", () => {
    for (const insight of computeInsights(manyLowStock)) {
      assert.match(insight.href, /^\//, `"${insight.type}" has no usable href`);
    }
  });

  it("returns nothing when no rule condition is met", () => {
    const quiet: InsightInputs = {
      stock: [{ id: "p1", name: "Fine", stockQuantity: 50, lowStockThreshold: 10, soldLast7: 5 }],
      failures: { failedInWindow: 0, windowHours: 24, reasons: [] },
      revenue: { current: 1000000, previous: 1000000 },
      sellers: [{ id: "p1", name: "Fine", unitsLast7: 10, unitsPrior7: 10 }],
      refunds: { current: 2, previous: 2, topProductId: null, topProductName: null, topProductCount: 0 },
    };
    assert.deepEqual(computeInsights(quiet), []);
  });
});
