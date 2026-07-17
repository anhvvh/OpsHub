import Link from "next/link";
import { DASHBOARD, SHOP } from "@/lib/mock";
import { kr } from "@/lib/format";

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

export default function DashboardPage() {
  const d = DASHBOARD;

  return (
    <main className="page dashboard">
      <header className="masthead">
        <div>
          <div className="kicker">{SHOP.name} · The Morning Briefing</div>
          <h1>{SHOP.briefingDate}</h1>
        </div>
        <div className="masthead-aside">
          Revenue{" "}
          <b className="serif" style={{ fontSize: 18, color: "var(--ink)" }}>
            {kr(d.revenueTodayOre)}
          </b>
          <br />
          {d.ordersToday} orders · <span style={{ color: "var(--ok-bright)" }}>▲ {d.revenueDeltaPct}%</span>
        </div>
      </header>

      {/* Lead alert + two secondary insights. Ranked: one thing first. */}
      <section className="insight-grid" aria-label="Today's insights">
        <div className="lead-insight">
          <div className="lead-kicker sev-critical">✦ Lead alert · Low stock</div>
          <h2 className="lead-headline" style={{ margin: 0 }}>
            Only <span className="sev-critical">4 units</span> of Lavender Face Serum left
          </h2>
          <p className="lead-body">
            Your bestseller is under its threshold of 15 with a promo this weekend. Reorder now to
            avoid a stockout during peak demand.
          </p>
          <Link className="lead-cta" href="/inventory/HAL-SER-LAV">
            Reorder Lavender Serum →
          </Link>
        </div>

        <div className="side-insights">
          <Link className="side-insight" href="/payments">
            <div className="side-kicker sev-warning">Refund spike</div>
            <div className="side-headline">
              <span className="sev-warning">+40%</span> refunds
            </div>
            <div className="side-body">6 of 9 on Rosehip Night Cream — check the latest batch.</div>
          </Link>
          <Link className="side-insight" href="/inventory/HAL-SER-VITC">
            <div className="side-kicker sev-positive">Hot seller</div>
            <div className="side-headline">
              Vitamin C <span className="sev-positive">3×</span>
            </div>
            <div className="side-body">84 sold this week — protect stock, push the ad.</div>
          </Link>
        </div>
      </section>

      <section className="ledger" aria-label="Today at a glance">
        <div>
          <div className="kpi-label">Revenue today</div>
          <div className="kpi-value">{kr(d.revenueTodayOre)}</div>
          <Sparks values={d.revenueSparks} tone="hot" />
          <div className="delta-up">▲ {d.revenueDeltaPct}% vs yesterday</div>
        </div>
        <div>
          <div className="kpi-label">Orders today</div>
          <div className="kpi-value">{d.ordersToday}</div>
          <Sparks values={d.ordersSparks} tone="hot-alt" />
          <div className="delta-up">▲ {d.ordersDelta} vs yesterday</div>
        </div>
        <div>
          <div className="kpi-label">Pending pay</div>
          <div className="kpi-value">{d.pendingPayments}</div>
          <div className="kpi-note">{kr(d.pendingPaymentsOre)} in flight</div>
        </div>
        <div>
          <div className="kpi-label">Open refunds</div>
          <div className="kpi-value sev-critical">{d.openRefunds}</div>
          <div className="delta-down">▲ {d.openRefundsDelta} vs last week</div>
        </div>
      </section>
    </main>
  );
}
