/**
 * Seed: one month in the life of Hälsa Skincare (SEK / öre).
 *
 * The dataset deliberately engineers the five AI-insight scenarios (PRD §Sample Data):
 *  1. Low stock         — Lavender Face Serum 4/15, Rosehip Cleansing Oil 9/12, Sea Buckthorn Balm 11/15
 *  2. Failures rising   — a cluster of failed payments in the last 24h
 *  3. Revenue down      — last 7 days ≈ −20% vs the 7 before
 *  4. Hot seller        — Vitamin C Brightening Serum ≈ 3× its prior-week rate
 *  5. Refund spike      — refunds up ~40% WoW, concentrated on Rosehip Night Cream
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Deterministic PRNG so reseeding produces the same believable month.
let rngState = 421;
function rand(): number {
  rngState = (rngState * 1103515245 + 12345) % 2147483648;
  return rngState / 2147483648;
}
function randInt(min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}
function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const products = [
  // [sku, name, category, priceOre, promoPriceOre|null, stock, threshold]
  ["HAL-SER-LAV", "Lavender Face Serum", "Serums", 54900, 46900, 4, 15],
  ["HAL-CLN-ROS", "Rosehip Cleansing Oil", "Cleansers", 39900, 33900, 9, 12],
  ["HAL-BLM-SEA", "Sea Buckthorn Balm", "Balms", 45900, 38900, 11, 15],
  ["HAL-SER-VITC", "Vitamin C Brightening Serum", "Serums", 69900, 59900, 58, 20],
  ["HAL-CRM-CHA", "Chamomile Day Cream", "Creams", 42900, 36900, 42, 15],
  ["HAL-CRM-ROS", "Rosehip Night Cream", "Creams", 47900, 40900, 63, 15],
  ["HAL-CLN-GEN", "Gentle Foaming Cleanser", "Cleansers", 24900, 20900, 88, 20],
  ["HAL-BND-GLW", "Nordic Glow Bundle", "Bundles", 89900, 74900, 24, 10],
  ["HAL-TON-BIR", "Birch Sap Toner", "Toners", 27900, null, 51, 15],
  ["HAL-EYE-CLB", "Cloudberry Eye Cream", "Creams", 38900, null, 33, 12],
  ["HAL-MSK-OAT", "Oat Milk Recovery Mask", "Masks", 32900, null, 47, 15],
  ["HAL-OIL-MID", "Midnight Sun Face Oil", "Oils", 51900, null, 29, 12],
] as const;

const firstNames = ["Elin", "Johan", "Astrid", "Karin", "Lars", "Sofia", "Erik", "Maja", "Nils", "Freja", "Oskar", "Ingrid", "Axel", "Linnea", "Gustav", "Ebba", "Hugo", "Alva", "Viktor", "Stina"];
const lastNames = ["Sundqvist", "Berg", "Lindqvist", "Ohlsson", "Nyström", "Ekström", "Wallin", "Holm", "Franzén", "Åberg", "Dahl", "Sjögren", "Lundgren", "Bergström", "Nilsson", "Hedlund", "Forsberg", "Vikander", "Månsson", "Ekberg"];
const streets = ["Storgatan", "Kungsgatan", "Drottninggatan", "Vasagatan", "Birger Jarlsgatan", "Sveavägen", "Odengatan", "Hornsgatan", "Götgatan", "Ringvägen"];
const cities = [["114 51", "Stockholm"], ["411 03", "Göteborg"], ["211 19", "Malmö"], ["753 10", "Uppsala"], ["582 22", "Linköping"], ["903 26", "Umeå"], ["702 11", "Örebro"], ["352 30", "Växjö"]];

function customer() {
  const fn = pick(firstNames);
  const ln = pick(lastNames);
  const [zip, city] = pick(cities);
  return {
    name: `${fn} ${ln}`,
    email: `${fn.toLowerCase()}.${ln.toLowerCase().replace(/å/g, "a").replace(/ä/g, "a").replace(/ö/g, "o").replace(/é/g, "e")}@epost.se`,
    address: `${pick(streets)} ${randInt(1, 60)}\n${zip} ${city}, Sweden`,
  };
}

function effectivePrice(p: (typeof products)[number]): number {
  return p[4] ?? p[3];
}

/** Weighted product pick for a given day-offset (daysAgo). Engineers hot-seller + refund-target volume. */
function pickProductIndex(daysAgo: number): number {
  // Base weights roughly proportional to popularity.
  const weights = products.map((_, i) => (i < 8 ? 3 : 2));
  // Hot seller: Vitamin C (index 3) sells ~3x in the last 7 days.
  if (daysAgo < 7) weights[3] = 16;
  else weights[3] = 2;
  // Rosehip Night Cream (index 5) steady volume so refunds have orders to attach to.
  weights[5] = 5;
  // Lavender serum (index 0) popular always (it's the bestseller running low).
  weights[0] = 7;
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return 0;
}

async function main() {
  console.log("Clearing existing data…");
  await prisma.orderEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();

  console.log("Seeding products…");
  const productRows = [];
  for (const p of products) {
    productRows.push(
      await prisma.product.create({
        data: {
          sku: p[0],
          name: p[1],
          category: p[2],
          priceOre: p[3],
          promoPriceOre: p[4],
          stockQuantity: p[5],
          lowStockThreshold: p[6],
          description: `${p[1]} — small-batch Nordic skincare from Hälsa.`,
        },
      }),
    );
  }

  console.log("Seeding one month of orders…");
  let orderSeq = 1000;
  let paymentSeq = 4400;

  // Revenue shape: prior week noticeably stronger than last week (≈ −20% WoW).
  // ordersForDay(daysAgo): base 14–20/day, boosted days 7–13, softened days 0–6.
  function ordersForDay(daysAgo: number): number {
    const base = randInt(14, 20);
    if (daysAgo >= 7 && daysAgo <= 13) return base + 4; // strong prior week
    return base;
  }

  for (let daysAgo = 29; daysAgo >= 0; daysAgo--) {
    const dayStart = new Date(startOfToday.getTime() - daysAgo * DAY);
    // Today only has a partial day of orders.
    const count = daysAgo === 0 ? 9 : ordersForDay(daysAgo);

    for (let i = 0; i < count; i++) {
      orderSeq++;
      paymentSeq++;
      const cust = customer();
      const channel = rand() < 0.7 ? "SHOPIFY" : "AMAZON";
      const provider = rand() < 0.65 ? "STRIPE" : "KLARNA";

      // 1–3 line items.
      const nItems = rand() < 0.55 ? 1 : rand() < 0.8 ? 2 : 3;
      const chosen = new Set<number>();
      while (chosen.size < nItems) chosen.add(pickProductIndex(daysAgo));
      const items = [...chosen].map((idx) => ({
        productId: productRows[idx].id,
        productIdx: idx,
        quantity: rand() < 0.85 ? 1 : 2,
        unitPriceOre: effectivePrice(products[idx]),
      }));
      const totalOre = items.reduce((s, it) => s + it.quantity * it.unitPriceOre, 0);

      // Time of day: 08:00–21:00; today's orders all before "now".
      const placedAt = new Date(
        dayStart.getTime() +
          (daysAgo === 0
            ? randInt(7 * 60, Math.max(8 * 60, Math.floor((now.getTime() - dayStart.getTime()) / 60000) - 10))
            : randInt(8 * 60, 21 * 60)) *
            60000,
      );

      // ----- Decide lifecycle -----
      // Refund spike: last 7 days ~9 refunds, 6 on Rosehip Night Cream (idx 5);
      // prior week ~6 refunds spread out. Implemented via quotas below.
      let status = "DELIVERED";
      let payStatus = "SUCCEEDED";
      let failureReason: string | null = null;

      const hasRosehipNight = items.some((it) => it.productIdx === 5);
      const isRefund =
        (daysAgo < 7 && hasRosehipNight && refundQuota.rosehipLast7 > 0 && rand() < 0.6 && (refundQuota.rosehipLast7--, true)) ||
        (daysAgo < 7 && !hasRosehipNight && refundQuota.otherLast7 > 0 && rand() < 0.08 && (refundQuota.otherLast7--, true)) ||
        (daysAgo >= 7 && daysAgo < 14 && refundQuota.priorWeek > 0 && rand() < 0.08 && (refundQuota.priorWeek--, true)) ||
        (daysAgo >= 14 && rand() < 0.015);

      // Failed payments: cluster in last 24h (quota 3) + rare background failures.
      const isFailed =
        !isRefund &&
        ((daysAgo === 0 && failQuota.today > 0 && rand() < 0.5 && (failQuota.today--, true)) ||
          (daysAgo === 1 && failQuota.yesterday > 0 && rand() < 0.35 && (failQuota.yesterday--, true)) ||
          (daysAgo > 1 && rand() < 0.012));

      if (isRefund) {
        status = "REFUNDED";
        payStatus = "REFUNDED";
      } else if (isFailed) {
        status = "PENDING_PAYMENT";
        payStatus = "FAILED";
        failureReason = pick(["card_declined", "insufficient_funds", "expired_card"]);
      } else if (daysAgo === 0) {
        const r = rand();
        status = r < 0.35 ? "PAID" : r < 0.55 ? "PENDING_PAYMENT" : r < 0.85 ? "FULFILLED" : "DELIVERED";
        payStatus = status === "PENDING_PAYMENT" ? "PENDING" : "SUCCEEDED";
      } else if (daysAgo === 1) {
        const r = rand();
        status = r < 0.3 ? "FULFILLED" : "DELIVERED";
        payStatus = "SUCCEEDED";
      } else if (rand() < 0.02) {
        status = "CANCELLED";
        payStatus = "PENDING";
      }

      const order = await prisma.order.create({
        data: {
          orderNumber: `OH-${orderSeq}`,
          customerName: cust.name,
          customerEmail: cust.email,
          shippingAddress: cust.address,
          channel,
          status,
          totalOre,
          createdAt: placedAt,
          updatedAt: placedAt,
          items: {
            create: items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPriceOre: it.unitPriceOre,
            })),
          },
        },
      });

      await prisma.payment.create({
        data: {
          paymentNumber: `PMT-${paymentSeq}`,
          orderId: order.id,
          provider,
          status: payStatus,
          amountOre: totalOre,
          failureReason,
          createdAt: new Date(placedAt.getTime() + randInt(1, 5) * 60000),
          updatedAt: new Date(placedAt.getTime() + randInt(5, 60) * 60000),
        },
      });

      // ----- Timeline events -----
      const events: { type: string; description: string; at: Date }[] = [
        { type: "ORDER_PLACED", description: `Order placed via ${channel === "SHOPIFY" ? "Shopify" : "Amazon"}`, at: placedAt },
      ];
      const providerLabel = provider === "STRIPE" ? "Stripe" : "Klarna";
      if (payStatus === "FAILED") {
        events.push({ type: "PAYMENT_FAILED", description: `Payment failed — ${providerLabel} (${failureReason})`, at: new Date(placedAt.getTime() + 3 * 60000) });
      } else if (payStatus !== "PENDING") {
        events.push({ type: "PAYMENT_RECEIVED", description: `Payment received — ${providerLabel}`, at: new Date(placedAt.getTime() + 3 * 60000) });
      }
      if (["FULFILLED", "DELIVERED", "REFUNDED"].includes(status)) {
        events.push({ type: "FULFILLED", description: "Fulfilled — shipped via PostNord", at: new Date(placedAt.getTime() + randInt(4, 9) * 3600000) });
      }
      if (["DELIVERED", "REFUNDED"].includes(status)) {
        events.push({ type: "DELIVERED", description: "Delivered", at: new Date(placedAt.getTime() + randInt(20, 44) * 3600000) });
      }
      if (status === "REFUNDED") {
        events.push({ type: "REFUNDED", description: `Refund issued — ${providerLabel}`, at: new Date(placedAt.getTime() + randInt(46, 90) * 3600000) });
      }
      if (status === "CANCELLED") {
        events.push({ type: "CANCELLED", description: "Cancelled by customer", at: new Date(placedAt.getTime() + randInt(1, 4) * 3600000) });
      }
      for (const e of events) {
        await prisma.orderEvent.create({
          data: { orderId: order.id, type: e.type, description: e.description, createdAt: e.at },
        });
      }
    }
  }

  const orderCount = await prisma.order.count();
  const refundsLast7 = await prisma.order.count({
    where: { status: "REFUNDED", createdAt: { gte: new Date(startOfToday.getTime() - 6 * DAY) } },
  });
  const failed24 = await prisma.payment.count({
    where: { status: "FAILED", createdAt: { gte: new Date(now.getTime() - DAY) } },
  });
  console.log(`Seeded ${orderCount} orders. Refunds last 7d: ${refundsLast7}. Failed payments last 24h: ${failed24}.`);
}

// Quotas that shape the engineered scenarios.
const refundQuota = { rosehipLast7: 6, otherLast7: 3, priorWeek: 6 };
const failQuota = { today: 2, yesterday: 1 };

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
