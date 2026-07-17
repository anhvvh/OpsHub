/**
 * The insight rule engine — the app's primary testing seam (PRD §Testing Decisions).
 *
 * Five pure functions: a snapshot of queried data in, fired insights out.
 * No database, no clock, no LLM — callers supply everything, tests construct it.
 */
import { INSIGHT_CONFIG as C } from "./config";

export type InsightType =
  | "LOW_STOCK"
  | "PAYMENT_FAILURES"
  | "REVENUE_DOWN"
  | "HOT_SELLER"
  | "REFUND_SPIKE";

export type Severity = "critical" | "warning" | "positive" | "info";

export interface Insight {
  type: InsightType;
  severity: Severity;
  /** Deterministic template headline — always available, LLM may rephrase. */
  headline: string;
  /** Deterministic template action line. */
  action: string;
  /** Where "one click to act" goes. */
  href: string;
  /** Raw numbers behind the insight (given to the LLM, shown in tests). */
  facts: Record<string, string | number>;
  /** Stable fingerprint for caching LLM phrasings. */
  fingerprint: string;
}

// ---------- Input snapshot shapes (constructed by queries or by tests) ----------

export interface StockSnapshot {
  id: string;
  name: string;
  stockQuantity: number;
  lowStockThreshold: number;
  /** Units sold in the last 7 days (contextualizes urgency). */
  soldLast7: number;
}

export interface FailureSnapshot {
  failedInWindow: number;
  windowHours: number;
  reasons: string[];
}

export interface PeriodComparison {
  /** Sum for the last 7 days (öre for revenue, count for refunds, units for sales). */
  current: number;
  /** Sum for the 7 days before that. */
  previous: number;
}

export interface HotSellerSnapshot {
  id: string;
  name: string;
  unitsLast7: number;
  unitsPrior7: number;
}

export interface RefundSpikeSnapshot extends PeriodComparison {
  topProductName: string | null;
  topProductId: string | null;
  topProductCount: number;
}

// ---------- Rules ----------

export function lowStockRule(products: StockSnapshot[]): Insight[] {
  return products
    .filter((p) => p.stockQuantity < p.lowStockThreshold)
    .sort((a, b) => a.stockQuantity / a.lowStockThreshold - b.stockQuantity / b.lowStockThreshold)
    .map((p) => ({
      type: "LOW_STOCK" as const,
      severity: (p.stockQuantity <= p.lowStockThreshold / 3 ? "critical" : "warning") as Severity,
      headline: `${p.name}: ${p.stockQuantity} left (low at ${p.lowStockThreshold})`,
      action: "Reorder now.",
      href: `/inventory/${p.id}`,
      facts: {
        product: p.name,
        stock: p.stockQuantity,
        threshold: p.lowStockThreshold,
        soldLast7: p.soldLast7,
      },
      fingerprint: `LOW_STOCK:${p.id}:${p.stockQuantity}:${p.lowStockThreshold}`,
    }));
}

export function paymentFailuresRule(s: FailureSnapshot): Insight[] {
  if (s.failedInWindow < C.failedPayments24hThreshold) return [];
  return [
    {
      type: "PAYMENT_FAILURES",
      severity: "critical",
      headline: `${s.failedInWindow} failed payments in ${s.windowHours}h`,
      action: "Check the payment provider.",
      href: "/payments?status=failed",
      facts: {
        failed: s.failedInWindow,
        windowHours: s.windowHours,
        reasons: s.reasons.join(", "),
      },
      fingerprint: `PAYMENT_FAILURES:${s.failedInWindow}:${s.windowHours}`,
    },
  ];
}

export function revenueDownRule(rev: PeriodComparison): Insight[] {
  if (rev.previous <= 0) return []; // no baseline — never divide by zero
  const delta = rev.current / rev.previous - 1;
  // Compare on the rounded percentage, not the raw float: 9/10-1 is
  // -0.09999999999999998 in IEEE754, which would wrongly pass a strict
  // "> -0.1" check on a true 10% decline (same bug class fixed in
  // refundSpikeRule below).
  const pct = Math.round(delta * 100);
  if (pct > C.revenueDropThreshold * 100) return [];
  return [
    {
      type: "REVENUE_DOWN",
      severity: "warning",
      headline: `Revenue ${pct}% vs last week`,
      action: "Review before month-end.",
      href: "/orders",
      facts: {
        currentOre: rev.current,
        previousOre: rev.previous,
        deltaPct: pct,
      },
      fingerprint: `REVENUE_DOWN:${pct}`,
    },
  ];
}

export function hotSellerRule(products: HotSellerSnapshot[]): Insight[] {
  return products
    .filter(
      (p) =>
        p.unitsLast7 >= C.hotSellerMinUnits &&
        p.unitsPrior7 > 0 &&
        p.unitsLast7 / p.unitsPrior7 >= C.hotSellerMultiple,
    )
    .sort((a, b) => b.unitsLast7 / b.unitsPrior7 - a.unitsLast7 / a.unitsPrior7)
    .slice(0, 1) // one hot seller is a story; three is noise
    .map((p) => {
      const multiple = Math.round((p.unitsLast7 / p.unitsPrior7) * 10) / 10;
      return {
        type: "HOT_SELLER" as const,
        severity: "positive" as Severity,
        headline: `${p.name}: sales ${multiple}× last week`,
        action: "Protect stock, push marketing.",
        href: `/inventory/${p.id}`,
        facts: {
          product: p.name,
          unitsLast7: p.unitsLast7,
          unitsPrior7: p.unitsPrior7,
          multiple,
        },
        fingerprint: `HOT_SELLER:${p.id}:${p.unitsLast7}:${p.unitsPrior7}`,
      };
    });
}

export function refundSpikeRule(s: RefundSpikeSnapshot): Insight[] {
  if (s.previous <= 0 || s.current < C.refundSpikeMinCount) return [];
  const delta = s.current / s.previous - 1;
  // Compare on the rounded percentage, not the raw float: 14/10-1 is
  // 0.3999999999999999 in IEEE754, which would wrongly fail a strict
  // "< 0.4" check on a true 40% jump — exactly the PRD's own worked example.
  const pct = Math.round(delta * 100);
  if (pct < C.refundSpikeThreshold * 100) return [];
  const concentration =
    s.topProductName && s.topProductCount > 1
      ? ` — ${s.topProductCount} of ${s.current} on ${s.topProductName}`
      : "";
  return [
    {
      type: "REFUND_SPIKE",
      severity: "critical",
      headline: `Refunds +${pct}%${concentration}`,
      action: s.topProductName ? "Check the latest batch." : "Review recent refunds.",
      href: s.topProductId ? `/inventory/${s.topProductId}` : "/payments?status=refunded",
      facts: {
        refundsLast7: s.current,
        refundsPrior7: s.previous,
        deltaPct: pct,
        topProduct: s.topProductName ?? "—",
        topProductCount: s.topProductCount,
      },
      fingerprint: `REFUND_SPIKE:${s.current}:${s.previous}:${s.topProductId ?? "none"}`,
    },
  ];
}

// ---------- Composition ----------

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, warning: 1, positive: 2, info: 3 };

export interface InsightInputs {
  stock: StockSnapshot[];
  failures: FailureSnapshot;
  revenue: PeriodComparison;
  sellers: HotSellerSnapshot[];
  refunds: RefundSpikeSnapshot;
}

/** Run every rule, rank by severity, cap the list (alert fatigue is a failure mode). */
export function computeInsights(inputs: InsightInputs): Insight[] {
  return [
    ...refundSpikeRule(inputs.refunds),
    ...lowStockRule(inputs.stock),
    ...paymentFailuresRule(inputs.failures),
    ...revenueDownRule(inputs.revenue),
    ...hotSellerRule(inputs.sellers),
  ]
    .sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
    .slice(0, C.maxInsights);
}
