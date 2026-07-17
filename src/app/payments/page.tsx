import PaymentsTable from "./PaymentsTable";
import { PAYMENTS, PAYMENT_SUMMARY, SHOP } from "@/lib/mock";
import { kr } from "@/lib/format";

export const metadata = { title: "Payments — OpsHub" };

export default function PaymentsPage() {
  const s = PAYMENT_SUMMARY;

  return (
    <main className="page">
      <header className="masthead" style={{ marginBottom: 22, alignItems: "baseline" }}>
        <h1 className="compact" style={{ margin: 0 }}>Payments</h1>
        <span className="count-note">{SHOP.today}</span>
      </header>

      <section className="paystrip" aria-label="Today's payment summary">
        <div>
          <div className="kpi-label">Settled today</div>
          <div className="pay-value">{kr(s.settledOre)}</div>
          <div className="pay-note">Stripe + Klarna</div>
        </div>
        <div>
          <div className="kpi-label">Succeeded</div>
          <div className="pay-value" style={{ color: "var(--ok-badge-fg)" }}>{s.succeeded.count}</div>
          <div className="pay-note">{kr(s.succeeded.amountOre)}</div>
        </div>
        <div>
          <div className="kpi-label">Pending</div>
          <div className="pay-value" style={{ color: "var(--warn-badge-fg)" }}>{s.pending.count}</div>
          <div className="pay-note">{kr(s.pending.amountOre)}</div>
        </div>
        <div>
          <div className="kpi-label">Failed</div>
          <div className="pay-value sev-critical">{s.failed.count}</div>
          <div className="pay-note">{kr(s.failed.amountOre)}</div>
        </div>
        <div>
          <div className="kpi-label">Refunded</div>
          <div className="pay-value" style={{ color: "var(--neutral-fg)" }}>{s.refunded.count}</div>
          <div className="pay-note">{kr(s.refunded.amountOre)}</div>
        </div>
      </section>

      <div className="attention-banner">
        <span className="card-label sev-critical" style={{ marginBottom: 0 }}>✦ Needs attention</span>
        <span style={{ font: "500 14px var(--font-sans)", color: "var(--ink)" }}>
          2 payments failed in the last 24h
        </span>
        <span style={{ font: "400 13px var(--font-sans)", color: "var(--muted)" }}>
          — card_declined &amp; insufficient_funds. Follow up before they churn.
        </span>
      </div>

      <PaymentsTable payments={PAYMENTS} />
    </main>
  );
}
