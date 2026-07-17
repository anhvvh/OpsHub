"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Tabs from "@/components/Tabs";
import { PaymentBadge } from "@/components/Badge";
import { PROVIDER_LABELS, type PaymentStatus, type Provider } from "@/lib/domain";
import type { listPayments } from "@/lib/queries/payments";
import { kr } from "@/lib/format";

type PaymentRow = Awaited<ReturnType<typeof listPayments>>[number];

const TABS = [
  { key: "all", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "SUCCEEDED", label: "Succeeded" },
  { key: "FAILED", label: "Failed" },
  { key: "REFUNDED", label: "Refunded" },
];

export default function PaymentsTable({
  payments,
  initialStatus = "all",
}: {
  payments: PaymentRow[];
  /** Pre-selects a tab from the page's `?status=` query param (dashboard deep-links). */
  initialStatus?: string;
}) {
  const [tab, setTab] = useState(initialStatus);

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
                  <Link href={`/orders/${p.order.orderNumber}`} className="cell-mono" style={{ color: "var(--accent)", fontSize: 12.5 }}>
                    {p.order.orderNumber}
                  </Link>
                </td>
                <td className="cell-sub">{PROVIDER_LABELS[p.provider as Provider]}</td>
                <td className="num amount">{kr(p.amountOre)}</td>
                <td><PaymentBadge status={p.status as PaymentStatus} /></td>
                <td
                  style={{
                    font: "400 12.5px var(--font-sans)",
                    color: p.status === "FAILED" ? "var(--crit-soft)" : "var(--faint)",
                  }}
                >
                  {p.failureReason ?? "—"}
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
