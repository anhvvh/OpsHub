import type { OrderStatus, PaymentStatus } from "@/lib/domain";

// Badge palettes come straight from the prototype: each lifecycle state owns a
// hue, so a row's state is readable before the label is.
const ORDER_BADGE: Record<OrderStatus, { bg: string; fg: string; label: string }> = {
  PENDING_PAYMENT: { bg: "var(--warn-badge-bg)", fg: "var(--warn-badge-fg)", label: "Pending payment" },
  PAID: { bg: "var(--paid-bg)", fg: "var(--paid-fg)", label: "Paid" },
  FULFILLED: { bg: "var(--fulfilled-bg)", fg: "var(--fulfilled-fg)", label: "Fulfilled" },
  DELIVERED: { bg: "var(--ok-badge-bg)", fg: "var(--ok-badge-fg)", label: "Delivered" },
  REFUNDED: { bg: "var(--crit-badge)", fg: "var(--crit-soft)", label: "Refunded" },
  CANCELLED: { bg: "var(--neutral-bg)", fg: "var(--neutral-fg)", label: "Cancelled" },
};

const PAYMENT_BADGE: Record<PaymentStatus, { bg: string; fg: string; label: string }> = {
  PENDING: { bg: "var(--warn-badge-bg)", fg: "var(--warn-badge-fg)", label: "Pending" },
  SUCCEEDED: { bg: "var(--ok-badge-bg)", fg: "var(--ok-badge-fg)", label: "Succeeded" },
  FAILED: { bg: "var(--crit-badge)", fg: "var(--crit-soft)", label: "Failed" },
  REFUNDED: { bg: "var(--neutral-bg)", fg: "var(--neutral-fg)", label: "Refunded" },
};

export function OrderBadge({ status, lg }: { status: OrderStatus; lg?: boolean }) {
  const b = ORDER_BADGE[status];
  return (
    <span className={`badge${lg ? " lg" : ""}`} style={{ background: b.bg, color: b.fg }}>
      {b.label}
    </span>
  );
}

export function PaymentBadge({ status, lg }: { status: PaymentStatus; lg?: boolean }) {
  const b = PAYMENT_BADGE[status];
  return (
    <span className={`badge${lg ? " lg" : ""}`} style={{ background: b.bg, color: b.fg }}>
      {b.label}
    </span>
  );
}
