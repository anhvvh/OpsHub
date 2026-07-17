import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderBadge, PaymentBadge } from "@/components/Badge";
import StatusChips from "@/components/StatusChips";
import { getOrderDetail } from "@/lib/queries/orders";
import { CHANNEL_LABELS, PROVIDER_LABELS, type Channel, type OrderStatus, type PaymentStatus, type Provider } from "@/lib/domain";
import { kr, shortDateTime } from "@/lib/format";

// Each timeline event type owns a colour, so the shape of an order's
// history is legible at a glance without reading the labels.
const TYPE_DOT: Record<string, string> = {
  ORDER_PLACED: "var(--bar-alt)",
  PAYMENT_RECEIVED: "#4d86ab",
  PAYMENT_FAILED: "var(--crit)",
  FULFILLED: "#7d70b8",
  DELIVERED: "#5c9450",
  STATUS_CHANGED: "#7d70b8",
  REFUNDED: "var(--crit)",
  CANCELLED: "var(--crit)",
};

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderDetail(decodeURIComponent(id));
  if (!order) notFound();

  const payment = order.payment;
  const subtotalOre = order.items.reduce((sum, i) => sum + i.unitPriceOre * i.quantity, 0);
  const shippingOre = order.totalOre - subtotalOre;

  return (
    <main className="page detail">
      <Link className="backlink" href="/orders">← All orders</Link>

      <header className="masthead">
        <div>
          <div className="kicker" style={{ letterSpacing: "0.16em" }}>
            Order · {CHANNEL_LABELS[order.channel as Channel]}
          </div>
          <h1 className="compact">{order.orderNumber}</h1>
        </div>
        <OrderBadge status={order.status as OrderStatus} lg />
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
                  <tr key={item.id}>
                    <td className="cell-main">{item.product.name}</td>
                    <td className="cell-sub" style={{ textAlign: "center" }}>{item.quantity}</td>
                    <td className="num amount">{kr(item.unitPriceOre * item.quantity)}</td>
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
              <span>{kr(Math.max(0, shippingOre))}</span>
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
              {order.shippingAddress.split("\n").map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          </div>

          {payment && (
            <div className="card">
              <div className="card-label">Payment</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ font: "500 15px var(--font-sans)" }}>
                  {PROVIDER_LABELS[payment.provider as Provider]}
                </span>
                <PaymentBadge status={payment.status as PaymentStatus} lg />
              </div>
              <div style={{ font: "400 12.5px var(--font-sans)", color: "var(--faint)", marginTop: 8 }}>
                {payment.status === "SUCCEEDED"
                  ? `Charged ${kr(payment.amountOre)}`
                  : `${kr(payment.amountOre)}${payment.failureReason ? ` · ${payment.failureReason}` : ""}`}
              </div>
              <Link href="/payments" style={{ marginTop: 10, display: "inline-block", font: "500 12px var(--font-sans)" }}>
                View in Payments →
              </Link>
            </div>
          )}

          <StatusChips orderId={order.id} initial={order.status as OrderStatus} />

          <div style={{ padding: "4px 2px 0" }}>
            <div className="card-label" style={{ marginBottom: 16 }}>Timeline</div>
            {order.events.map((e, i) => (
              <div className="tl-row" key={e.id}>
                <div className="tl-gutter">
                  <div className="tl-dot" style={{ background: TYPE_DOT[e.type] ?? "var(--faint)" }} />
                  {i < order.events.length - 1 && <div className="tl-line" />}
                </div>
                <div className="tl-body">
                  <div className="tl-title">{e.description}</div>
                  <div className="tl-time">{shortDateTime(e.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
