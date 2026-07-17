// Typed lifecycle vocabularies (SQLite can't enforce enums; these do).

export const ORDER_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "FULFILLED",
  "DELIVERED",
  "REFUNDED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const CHANNELS = ["SHOPIFY", "AMAZON"] as const;
export type Channel = (typeof CHANNELS)[number];

export const PROVIDERS = ["STRIPE", "KLARNA"] as const;
export type Provider = (typeof PROVIDERS)[number];

/** Allowed manual status transitions (Shopify-style lifecycle). */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["FULFILLED", "REFUNDED", "CANCELLED"],
  FULFILLED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  REFUNDED: [],
  CANCELLED: [],
};

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Pending payment",
  PAID: "Paid",
  FULFILLED: "Fulfilled",
  DELIVERED: "Delivered",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  PENDING: "Pending",
  SUCCEEDED: "Succeeded",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  SHOPIFY: "Shopify",
  AMAZON: "Amazon",
};

export const PROVIDER_LABELS: Record<Provider, string> = {
  STRIPE: "Stripe",
  KLARNA: "Klarna",
};
