// Temporary fixture data mirroring the approved claude.ai/design prototype.
// Shapes deliberately match the Prisma models in prisma/schema.prisma, so the
// screens can be repointed at real queries by swapping this module out.
//
// Amounts are in öre (SEK minor units) exactly as the database stores them.

import type { Channel, OrderStatus, PaymentStatus, Provider } from "./domain";

export type MockProduct = {
  id: string;
  sku: string;
  name: string;
  category: string;
  priceOre: number;
  promoPriceOre: number | null;
  stockQuantity: number;
  lowStockThreshold: number;
  soldThisWeek: number;
  /** Units sold per day, last 14 days — drives the product-detail bars. */
  sold14: number[];
};

export type MockOrderItem = { name: string; quantity: number; amountOre: number };

export type MockOrder = {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string[];
  channel: Channel;
  status: OrderStatus;
  totalOre: number;
  items: MockOrderItem[];
  shippingOre: number;
  events: { title: string; time: string; tone: TimelineTone }[];
};

export type TimelineTone = "placed" | "payment" | "fulfilled" | "delivered" | "refunded";

export type MockPayment = {
  id: string;
  paymentNumber: string;
  orderNumber: string;
  provider: Provider;
  status: PaymentStatus;
  amountOre: number;
  detail: string;
};

/* ------------------------------------------------------------------ shop */

export const SHOP = {
  name: "Hälsa Skincare",
  briefingDate: "Monday, 14 July",
  today: "Today · 14 Jul 2026",
};

/* -------------------------------------------------------------- products */

export const PRODUCTS: MockProduct[] = [
  {
    id: "lavender-face-serum",
    sku: "HAL-SER-LAV",
    name: "Lavender Face Serum",
    category: "Serums",
    priceOre: 54900,
    promoPriceOre: 46900,
    stockQuantity: 4,
    lowStockThreshold: 15,
    soldThisWeek: 31,
    sold14: [30, 45, 38, 52, 60, 48, 66, 58, 74, 62, 80, 70, 88, 100],
  },
  {
    id: "rosehip-cleansing-oil",
    sku: "HAL-CLN-ROS",
    name: "Rosehip Cleansing Oil",
    category: "Cleansers",
    priceOre: 39900,
    promoPriceOre: 33900,
    stockQuantity: 9,
    lowStockThreshold: 12,
    soldThisWeek: 18,
    sold14: [40, 52, 44, 58, 50, 62, 48, 55, 60, 52, 66, 58, 70, 64],
  },
  {
    id: "sea-buckthorn-balm",
    sku: "HAL-BLM-SEA",
    name: "Sea Buckthorn Balm",
    category: "Balms",
    priceOre: 45900,
    promoPriceOre: 38900,
    stockQuantity: 11,
    lowStockThreshold: 15,
    soldThisWeek: 14,
    sold14: [28, 36, 30, 42, 38, 46, 40, 44, 50, 42, 54, 48, 58, 52],
  },
  {
    id: "vitamin-c-brightening-serum",
    sku: "HAL-SER-VITC",
    name: "Vitamin C Brightening Serum",
    category: "Serums",
    priceOre: 69900,
    promoPriceOre: 59900,
    stockQuantity: 58,
    lowStockThreshold: 20,
    soldThisWeek: 84,
    sold14: [32, 40, 36, 44, 48, 52, 58, 62, 70, 76, 84, 90, 96, 100],
  },
  {
    id: "chamomile-day-cream",
    sku: "HAL-CRM-CHA",
    name: "Chamomile Day Cream",
    category: "Creams",
    priceOre: 42900,
    promoPriceOre: 36900,
    stockQuantity: 42,
    lowStockThreshold: 15,
    soldThisWeek: 22,
    sold14: [44, 50, 46, 54, 48, 56, 50, 58, 52, 60, 54, 62, 56, 64],
  },
  {
    id: "rosehip-night-cream",
    sku: "HAL-CRM-ROS",
    name: "Rosehip Night Cream",
    category: "Creams",
    priceOre: 47900,
    promoPriceOre: 40900,
    stockQuantity: 63,
    lowStockThreshold: 15,
    soldThisWeek: 27,
    sold14: [50, 58, 52, 60, 54, 62, 56, 64, 58, 66, 60, 68, 62, 70],
  },
  {
    id: "gentle-foaming-cleanser",
    sku: "HAL-CLN-GEN",
    name: "Gentle Foaming Cleanser",
    category: "Cleansers",
    priceOre: 24900,
    promoPriceOre: 20900,
    stockQuantity: 88,
    lowStockThreshold: 20,
    soldThisWeek: 35,
    sold14: [46, 54, 48, 56, 50, 58, 52, 60, 54, 62, 56, 64, 58, 66],
  },
  {
    id: "nordic-glow-bundle",
    sku: "HAL-BND-GLW",
    name: "Nordic Glow Bundle",
    category: "Bundles",
    priceOre: 89900,
    promoPriceOre: 74900,
    stockQuantity: 24,
    lowStockThreshold: 10,
    soldThisWeek: 12,
    sold14: [30, 38, 32, 40, 34, 42, 36, 44, 38, 46, 40, 48, 42, 50],
  },
];

export const productBySku = (sku: string) => PRODUCTS.find((p) => p.sku === sku);
export const isLow = (p: MockProduct) => p.stockQuantity < p.lowStockThreshold;

/* ---------------------------------------------------------------- orders */

export const ORDERS: MockOrder[] = [
  {
    id: "OH-1087",
    orderNumber: "OH-1087",
    date: "14 Jul",
    customerName: "Elin Sundqvist",
    customerEmail: "elin.sundqvist@epost.se",
    shippingAddress: ["Vasagatan 8", "111 20 Stockholm, Sweden"],
    channel: "SHOPIFY",
    status: "PENDING_PAYMENT",
    totalOre: 124000,
    shippingOre: 0,
    items: [
      { name: "Vitamin C Brightening Serum", quantity: 1, amountOre: 59900 },
      { name: "Nordic Glow Bundle", quantity: 1, amountOre: 64100 },
    ],
    events: [{ title: "Order placed", time: "14 Jul · 08:12", tone: "placed" }],
  },
  {
    id: "OH-1086",
    orderNumber: "OH-1086",
    date: "14 Jul",
    customerName: "Johan Berg",
    customerEmail: "johan.berg@epost.se",
    shippingAddress: ["Kungsgatan 22", "411 19 Göteborg, Sweden"],
    channel: "AMAZON",
    status: "PAID",
    totalOre: 68500,
    shippingOre: 0,
    items: [{ name: "Chamomile Day Cream", quantity: 1, amountOre: 68500 }],
    events: [
      { title: "Order placed", time: "14 Jul · 07:02", tone: "placed" },
      { title: "Payment received — Stripe", time: "14 Jul · 07:03", tone: "payment" },
    ],
  },
  {
    id: "OH-1085",
    orderNumber: "OH-1085",
    date: "14 Jul",
    customerName: "Astrid Lindqvist",
    customerEmail: "astrid.lindqvist@epost.se",
    shippingAddress: ["Sveavägen 41", "113 59 Stockholm, Sweden"],
    channel: "SHOPIFY",
    status: "PAID",
    totalOre: 213000,
    shippingOre: 0,
    items: [
      { name: "Nordic Glow Bundle", quantity: 2, amountOre: 149800 },
      { name: "Sea Buckthorn Balm", quantity: 1, amountOre: 63200 },
    ],
    events: [
      { title: "Order placed", time: "14 Jul · 06:31", tone: "placed" },
      { title: "Payment received — Stripe", time: "14 Jul · 06:32", tone: "payment" },
    ],
  },
  {
    id: "OH-1084",
    orderNumber: "OH-1084",
    date: "13 Jul",
    customerName: "Karin Ohlsson",
    customerEmail: "karin.ohlsson@epost.se",
    shippingAddress: ["Drottninggatan 5", "252 21 Helsingborg, Sweden"],
    channel: "SHOPIFY",
    status: "FULFILLED",
    totalOre: 44900,
    shippingOre: 0,
    items: [{ name: "Gentle Foaming Cleanser", quantity: 2, amountOre: 44900 }],
    events: [
      { title: "Order placed", time: "13 Jul · 11:20", tone: "placed" },
      { title: "Payment received — Klarna", time: "13 Jul · 11:22", tone: "payment" },
      { title: "Fulfilled — shipped via PostNord", time: "13 Jul · 17:40", tone: "fulfilled" },
    ],
  },
  {
    id: "OH-1083",
    orderNumber: "OH-1083",
    date: "13 Jul",
    customerName: "Lars Nyström",
    customerEmail: "lars.nystrom@epost.se",
    shippingAddress: ["Storgatan 3", "903 21 Umeå, Sweden"],
    channel: "AMAZON",
    status: "FULFILLED",
    totalOre: 89900,
    shippingOre: 0,
    items: [{ name: "Nordic Glow Bundle", quantity: 1, amountOre: 89900 }],
    events: [
      { title: "Order placed", time: "13 Jul · 09:05", tone: "placed" },
      { title: "Payment failed — card declined", time: "13 Jul · 09:06", tone: "refunded" },
      { title: "Fulfilled — shipped via PostNord", time: "13 Jul · 15:12", tone: "fulfilled" },
    ],
  },
  {
    id: "OH-1082",
    orderNumber: "OH-1082",
    date: "13 Jul",
    customerName: "Sofia Ekström",
    customerEmail: "sofia.ekstrom@epost.se",
    shippingAddress: ["Storgatan 14", "114 51 Stockholm, Sweden"],
    channel: "SHOPIFY",
    status: "DELIVERED",
    totalOre: 159800,
    shippingOre: 0,
    items: [
      { name: "Rosehip Cleansing Oil", quantity: 1, amountOre: 39900 },
      { name: "Vitamin C Brightening Serum", quantity: 1, amountOre: 69900 },
      { name: "Sea Buckthorn Balm", quantity: 1, amountOre: 50000 },
    ],
    events: [
      { title: "Order placed", time: "12 Jul · 09:38", tone: "placed" },
      { title: "Payment received — Stripe", time: "12 Jul · 09:41", tone: "payment" },
      { title: "Fulfilled — shipped via PostNord", time: "12 Jul · 16:05", tone: "fulfilled" },
      { title: "Delivered", time: "13 Jul · 14:22", tone: "delivered" },
    ],
  },
  {
    id: "OH-1081",
    orderNumber: "OH-1081",
    date: "12 Jul",
    customerName: "Erik Wallin",
    customerEmail: "erik.wallin@epost.se",
    shippingAddress: ["Nygatan 12", "753 20 Uppsala, Sweden"],
    channel: "SHOPIFY",
    status: "DELIVERED",
    totalOre: 32900,
    shippingOre: 0,
    items: [{ name: "Gentle Foaming Cleanser", quantity: 1, amountOre: 32900 }],
    events: [
      { title: "Order placed", time: "12 Jul · 08:14", tone: "placed" },
      { title: "Payment received — Stripe", time: "12 Jul · 08:15", tone: "payment" },
      { title: "Fulfilled — shipped via PostNord", time: "12 Jul · 14:02", tone: "fulfilled" },
      { title: "Delivered", time: "13 Jul · 10:47", tone: "delivered" },
    ],
  },
  {
    id: "OH-1080",
    orderNumber: "OH-1080",
    date: "12 Jul",
    customerName: "Maja Holm",
    customerEmail: "maja.holm@epost.se",
    shippingAddress: ["Ringvägen 60", "118 67 Stockholm, Sweden"],
    channel: "AMAZON",
    status: "REFUNDED",
    totalOre: 75600,
    shippingOre: 0,
    items: [{ name: "Rosehip Night Cream", quantity: 2, amountOre: 75600 }],
    events: [
      { title: "Order placed", time: "12 Jul · 07:44", tone: "placed" },
      { title: "Payment received — Klarna", time: "12 Jul · 07:45", tone: "payment" },
      { title: "Refunded — customer refund", time: "13 Jul · 12:30", tone: "refunded" },
    ],
  },
  {
    id: "OH-1079",
    orderNumber: "OH-1079",
    date: "12 Jul",
    customerName: "Nils Franzén",
    customerEmail: "nils.franzen@epost.se",
    shippingAddress: ["Hamngatan 2", "211 22 Malmö, Sweden"],
    channel: "SHOPIFY",
    status: "CANCELLED",
    totalOre: 54000,
    shippingOre: 0,
    items: [{ name: "Chamomile Day Cream", quantity: 1, amountOre: 54000 }],
    events: [
      { title: "Order placed", time: "12 Jul · 06:10", tone: "placed" },
      { title: "Cancelled — customer request", time: "12 Jul · 09:55", tone: "refunded" },
    ],
  },
];

export const orderByNumber = (n: string) => ORDERS.find((o) => o.orderNumber === n);

/* -------------------------------------------------------------- payments */

export const PAYMENTS: MockPayment[] = [
  { id: "PMT-4471", paymentNumber: "PMT-4471", orderNumber: "OH-1087", provider: "KLARNA", status: "PENDING", amountOre: 124000, detail: "Awaiting authorization" },
  { id: "PMT-4470", paymentNumber: "PMT-4470", orderNumber: "OH-1086", provider: "STRIPE", status: "SUCCEEDED", amountOre: 68500, detail: "—" },
  { id: "PMT-4469", paymentNumber: "PMT-4469", orderNumber: "OH-1085", provider: "STRIPE", status: "SUCCEEDED", amountOre: 213000, detail: "—" },
  { id: "PMT-4468", paymentNumber: "PMT-4468", orderNumber: "OH-1084", provider: "KLARNA", status: "SUCCEEDED", amountOre: 44900, detail: "—" },
  { id: "PMT-4467", paymentNumber: "PMT-4467", orderNumber: "OH-1083", provider: "STRIPE", status: "FAILED", amountOre: 89900, detail: "Card declined" },
  { id: "PMT-4466", paymentNumber: "PMT-4466", orderNumber: "OH-1082", provider: "STRIPE", status: "SUCCEEDED", amountOre: 159800, detail: "—" },
  { id: "PMT-4465", paymentNumber: "PMT-4465", orderNumber: "OH-1081", provider: "STRIPE", status: "FAILED", amountOre: 32900, detail: "Insufficient funds" },
  { id: "PMT-4464", paymentNumber: "PMT-4464", orderNumber: "OH-1080", provider: "KLARNA", status: "REFUNDED", amountOre: 75600, detail: "Customer refund" },
];

export const PAYMENT_SUMMARY = {
  settledOre: 3864000,
  succeeded: { count: 48, amountOre: 4489000 },
  pending: { count: 7, amountOre: 1420000 },
  failed: { count: 2, amountOre: 122800 },
  refunded: { count: 3, amountOre: 204100 },
};

/* ------------------------------------------------------- dashboard state */

export const DASHBOARD = {
  revenueTodayOre: 4238000,
  revenueDeltaPct: 8.2,
  ordersToday: 63,
  ordersDelta: 5,
  pendingPayments: 7,
  pendingPaymentsOre: 1420000,
  openRefunds: 4,
  openRefundsDelta: 2,
  revenueSparks: [42, 55, 48, 64, 58, 72, 90],
  ordersSparks: [42, 55, 48, 64, 58, 72, 90],
};
