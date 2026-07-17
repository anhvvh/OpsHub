// Every numeric constant the insight rules use, in one place (PRD §Implementation Decisions).
export const INSIGHT_CONFIG = {
  /** Failed payments in the rolling window to count as "rising". */
  failedPayments24hThreshold: 2,
  /** Rolling window for payment failures, in hours. */
  failureWindowHours: 24,
  /** Revenue decline (fraction) vs prior 7 days that fires the alert. */
  revenueDropThreshold: -0.1,
  /** Sales multiple vs prior 7 days that makes a product a "hot seller". */
  hotSellerMultiple: 2,
  /** Minimum units in the last 7 days before hot-seller can fire (noise floor). */
  hotSellerMinUnits: 10,
  /** Refund increase (fraction) vs prior 7 days that fires the alert. */
  refundSpikeThreshold: 0.4,
  /** Minimum refunds in the last 7 days before refund-spike can fire. */
  refundSpikeMinCount: 3,
  /** Maximum insights shown on the dashboard. */
  maxInsights: 5,
} as const;
