import Link from "next/link";
import { getDashboardData } from "@/lib/queries/dashboard";
import { SHOP_NAME } from "@/lib/domain";
import type { InsightType } from "@/lib/insights/rules";
import { kr, longToday } from "@/lib/format";

const TYPE_LABEL: Record<InsightType, string> = {
  LOW_STOCK: "Low stock",
  PAYMENT_FAILURES: "Payment failures",
  REVENUE_DOWN: "Revenue down",
  HOT_SELLER: "Hot seller",
  REFUND_SPIKE: "Refund spike",
};

const SEV_CLASS = {
  critical: "sev-critical",
  warning: "sev-warning",
  positive: "sev-positive",
  info: "sev-info",
} as const;

function Sparks({ values, tone }: { values: number[]; tone: "hot" | "hot-alt" }) {
  // The last two bars carry the accent: the eye should land on "now".
  return (
    <div className="sparks" aria-hidden="true">
      {values.map((h, i) => (
        <span
          key={i}
          className={i >= values.length - 2 ? tone : undefined}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

export const dynamic = "force-dynamic"; // KPIs and insights must reflect the live database on every load.

export default async function DashboardPage() {
  const d = await getDashboardData();
  const [lead, ...secondary] = d.insights;
  const side = secondary.slice(0, 2);

  return (
    <main className="page dashboard">
      <header className="masthead">
        <div>
          <div className="kicker">{SHOP_NAME} · The Morning Briefing</div>
          <h1>{longToday()}</h1>
        </div>
        <div className="masthead-aside">
          Revenue{" "}
          <b className="serif" style={{ fontSize: 18, color: "var(--ink)" }}>
            {kr(d.revenueTodayOre)}
          </b>
          <br />
          {d.ordersToday} orders ·{" "}
          <span style={{ color: d.revenueDeltaPct >= 0 ? "var(--ok-bright)" : "var(--crit)" }}>
            {d.revenueDeltaPct >= 0 ? "▲" : "▼"} {Math.abs(d.revenueDeltaPct)}%
          </span>
        </div>
      </header>

      {/* Lead alert + up to two secondary insights, ranked by severity. */}
      {lead ? (
        <section className="insight-grid" aria-label="Today's insights">
          <Link className="lead-insight" href={lead.href}>
            <div className={`lead-kicker ${SEV_CLASS[lead.severity]}`}>
              ✦ Lead alert · {TYPE_LABEL[lead.type]}
            </div>
            <h2 className="lead-headline" style={{ margin: 0 }}>
              {lead.headline}
            </h2>
            <p className="lead-body">{lead.action}</p>
            <span className="lead-cta">View detail →</span>
          </Link>

          {side.length > 0 && (
            <div className="side-insights">
              {side.map((insight) => (
                <Link key={insight.fingerprint} className="side-insight" href={insight.href}>
                  <div className={`side-kicker ${SEV_CLASS[insight.severity]}`}>
                    {TYPE_LABEL[insight.type]}
                  </div>
                  <div className="side-headline">{insight.headline}</div>
                  <div className="side-body">{insight.action}</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="insight-grid" aria-label="Today's insights">
          <div className="lead-insight" style={{ borderLeftColor: "var(--ok)" }}>
            <div className="lead-kicker sev-positive">✦ All clear</div>
            <h2 className="lead-headline" style={{ margin: 0 }}>
              Nothing needs your attention right now
            </h2>
            <p className="lead-body">Stock, payments, and revenue are all within normal range.</p>
          </div>
        </section>
      )}

      <section className="ledger" aria-label="Today at a glance">
        <div>
          <div className="kpi-label">Revenue today</div>
          <div className="kpi-value">{kr(d.revenueTodayOre)}</div>
          <Sparks values={d.revenueSparks} tone="hot" />
          <div className={d.revenueDeltaPct >= 0 ? "delta-up" : "delta-down"}>
            {d.revenueDeltaPct >= 0 ? "▲" : "▼"} {Math.abs(d.revenueDeltaPct)}% vs yesterday
          </div>
        </div>
        <div>
          <div className="kpi-label">Orders today</div>
          <div className="kpi-value">{d.ordersToday}</div>
          <Sparks values={d.ordersSparks} tone="hot-alt" />
          <div className={d.ordersDelta >= 0 ? "delta-up" : "delta-down"}>
            {d.ordersDelta >= 0 ? "▲" : "▼"} {Math.abs(d.ordersDelta)} vs yesterday
          </div>
        </div>
        <div>
          <div className="kpi-label">Pending pay</div>
          <div className="kpi-value">{d.pendingPayments}</div>
          <div className="kpi-note">{kr(d.pendingPaymentsOre)} in flight</div>
        </div>
        <div>
          <div className="kpi-label">Open refunds</div>
          <div className="kpi-value sev-critical">{d.openRefunds}</div>
          <div className={d.openRefundsDelta >= 0 ? "delta-down" : "delta-up"}>
            {d.openRefundsDelta >= 0 ? "▲" : "▼"} {Math.abs(d.openRefundsDelta)} vs last week
          </div>
        </div>
      </section>
    </main>
  );
}
