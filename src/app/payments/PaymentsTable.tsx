"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Tabs from "@/components/Tabs";
import { PaymentBadge } from "@/components/Badge";
import type { MockPayment } from "@/lib/mock";
import { kr } from "@/lib/format";

const TABS = [
  { key: "all", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "SUCCEEDED", label: "Succeeded" },
  { key: "FAILED", label: "Failed" },
  { key: "REFUNDED", label: "Refunded" },
];

const PROVIDER_LABEL = { STRIPE: "Stripe", KLARNA: "Klarna" } as const;

export default function PaymentsTable({ payments }: { payments: MockPayment[] }) {
  const [tab, setTab] = useState("all");

  const rows = useMemo(
    () => payments.filter((p) => tab === "all" || p.status === tab),
    [payments, tab],
  );

  return (
    <>
      <Tabs tabs={TABS} active={tab} onChange={setTab} label="Filter payments by status" />

      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Payment</th>
              <th>Order</th>
              <th>Provider</th>
              <th className="num">Amount</th>
              <th>Status</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="cell-mono">{p.paymentNumber}</td>
                <td>
                  <Link href={`/orders/${p.orderNumber}`} className="cell-mono" style={{ color: "var(--accent)", fontSize: 12.5 }}>
                    {p.orderNumber}
                  </Link>
                </td>
                <td className="cell-sub">{PROVIDER_LABEL[p.provider]}</td>
                <td className="num amount">{kr(p.amountOre)}</td>
                <td><PaymentBadge status={p.status} /></td>
                <td
                  style={{
                    font: "400 12.5px var(--font-sans)",
                    color: p.status === "FAILED" ? "var(--crit-soft)" : "var(--faint)",
                  }}
                >
                  {p.detail}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">No payments match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
