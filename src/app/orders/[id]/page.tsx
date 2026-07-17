import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderBadge, PaymentBadge } from "@/components/Badge";
import StatusChips from "@/components/StatusChips";
import { ORDERS, PAYMENTS, orderByNumber, type TimelineTone } from "@/lib/mock";
import { kr } from "@/lib/format";

const CHANNEL_LABEL = { SHOPIFY: "Shopify", AMAZON: "Amazon" } as const;
const PROVIDER_LABEL = { STRIPE: "Stripe", KLARNA: "Klarna" } as const;

// Each timeline stage owns a colour, so the shape of an order's history is
// legible at a glance without reading the labels.
const TONE_DOT: Record<TimelineTone, string> = {
  placed: "var(--bar-alt)",
  payment: "#4d86ab",
  fulfilled: "#7d70b8",
  delivered: "#5c9450",
  refunded: "var(--crit)",
};

export function generateStaticParams() {
  return ORDERS.map((o) => ({ id: o.orderNumber }));
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = orderByNumber(decodeURIComponent(id));
  if (!order) notFound();

  const payment = PAYMENTS.find((p) => p.orderNumber === order.orderNumber);
  const subtotalOre = order.items.reduce((sum, i) => sum + i.amountOre, 0);

  return (
    <main className="page detail">
      <Link className="backlink" href="/orders">← All orders</Link>

      <header className="masthead">
        <div>
          <div className="kicker" style={{ letterSpacing: "0.16em" }}>
            Order · {CHANNEL_LABEL[order.channel]}
          </div>
          <h1 className="compact">{order.orderNumber}</h1>
        </div>
        <OrderBadge status={order.status} lg />
      </header>

      <div className="two-col two-col-order">
        <div>
          <div className="table-scroll">
            <table className="data" style={{ marginBottom: 20 }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: "center" }}>Qty</th>
                  <th className="num">Amount</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.name}>
                    <td className="cell-main">{item.name}</td>
                    <td className="cell-sub" style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td className="num amount">{kr(item.amountOre)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="totals">
            <div className="totals-row">
              <span>Subtotal</span>
              <span>{kr(subtotalOre)}</span>
            </div>
            <div className="totals-row">
              <span>Shipping</span>
              <span>{kr(order.shippingOre)}</span>
            </div>
            <div className="totals-row grand">
              <span>Total</span>
              <span>{kr(order.totalOre)}</span>
            </div>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-label">Customer</div>
            <div style={{ font: "500 15px var(--font-sans)" }}>{order.customerName}</div>
            <div className="cell-sub" style={{ marginTop: 2 }}>{order.customerEmail}</div>
            <div style={{ marginTop: 12, font: "400 13px/1.5 var(--font-sans)", color: "var(--muted)" }}>
              {order.shippingAddress.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          {payment && (
            <div className="card">
              <div className="card-label">Payment</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ font: "500 15px var(--font-sans)" }}>
                  {PROVIDER_LABEL[payment.provider]}
                </span>
                <PaymentBadge status={payment.status} lg />
              </div>
              <div style={{ font: "400 12.5px var(--font-sans)", color: "var(--faint)", marginTop: 8 }}>
                {payment.status === "SUCCEEDED"
                  ? `Charged ${kr(payment.amountOre)}`
                  : `${kr(payment.amountOre)} · ${payment.detail}`}
              </div>
              <Link href="/payments" style={{ marginTop: 10, display: "inline-block", font: "500 12px var(--font-sans)" }}>
                View in Payments →
              </Link>
            </div>
          )}

          <StatusChips initial={order.status} />

          <div style={{ padding: "4px 2px 0" }}>
            <div className="card-label" style={{ marginBottom: 16 }}>Timeline</div>
            {order.events.map((e, i) => (
              <div className="tl-row" key={`${e.title}-${i}`}>
                <div className="tl-gutter">
                  <div className="tl-dot" style={{ background: TONE_DOT[e.tone] }} />
                  {i < order.events.length - 1 && <div className="tl-line" />}
                </div>
                <div className="tl-body">
                  <div className="tl-title">{e.title}</div>
                  <div className="tl-time">{e.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
