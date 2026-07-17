import PaymentsTable from "./PaymentsTable";
import { listPayments, getPaymentSummary } from "@/lib/queries/payments";
import { PAYMENT_STATUSES } from "@/lib/domain";
import { kr, longToday } from "@/lib/format";

export const metadata = { title: "Payments — OpsHub" };
export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [payments, s, params] = await Promise.all([listPayments(), getPaymentSummary(), searchParams]);
  const requested = params.status?.toUpperCase() ?? "";
  const statuses: readonly string[] = PAYMENT_STATUSES;
  const initialStatus = statuses.includes(requested) ? requested : "all";

  return (
    <main className="page">
      <header className="masthead" style={{ marginBottom: 22, alignItems: "baseline" }}>
        <h1 className="compact" style={{ margin: 0 }}>Payments</h1>
        <span className="count-note">Today · {longToday()}</span>
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

      {s.failedInLast24h > 0 && (
        <div className="attention-banner">
          <span className="card-label sev-critical" style={{ marginBottom: 0 }}>✦ Needs attention</span>
          <span style={{ font: "500 14px var(--font-sans)", color: "var(--ink)" }}>
            {s.failedInLast24h} payment{s.failedInLast24h === 1 ? "" : "s"} failed in the last 24h
          </span>
          {s.failedReasonsLast24h.length > 0 && (
            <span style={{ font: "400 13px var(--font-sans)", color: "var(--muted)" }}>
              — {s.failedReasonsLast24h.join(" & ")}. Follow up before they churn.
            </span>
          )}
        </div>
      )}

      <PaymentsTable payments={payments} initialStatus={initialStatus} />
    </main>
  );
}
