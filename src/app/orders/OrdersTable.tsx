"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Tabs from "@/components/Tabs";
import ColumnFilter from "@/components/ColumnFilter";
import { OrderBadge } from "@/components/Badge";
import { STATUS_LABELS } from "@/lib/domain";
import type { MockOrder } from "@/lib/mock";
import { kr } from "@/lib/format";

const TABS = [
  { key: "all", label: "All" },
  { key: "PENDING_PAYMENT", label: "Pending" },
  { key: "PAID", label: "Paid" },
  { key: "FULFILLED", label: "Fulfilled" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "REFUNDED", label: "Refunded" },
  { key: "CANCELLED", label: "Cancelled" },
];

const CHANNEL_LABEL = { SHOPIFY: "Shopify", AMAZON: "Amazon" } as const;

/** Column keys the caret filters operate on, matching the visible columns. */
type ColKey = "orderNumber" | "date" | "customerName" | "channel" | "total" | "status";

export default function OrdersTable({ orders }: { orders: MockOrder[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("all");
  // Absent key = no filter on that column; a Set = keep only these values.
  const [cols, setCols] = useState<Partial<Record<ColKey, Set<string>>>>({});

  const cellValue = (o: MockOrder, key: ColKey): string => {
    switch (key) {
      case "orderNumber": return o.orderNumber;
      case "date": return o.date;
      case "customerName": return o.customerName;
      case "channel": return CHANNEL_LABEL[o.channel];
      case "total": return kr(o.totalOre);
      case "status": return STATUS_LABELS[o.status];
    }
  };

  const optionsFor = (key: ColKey) => {
    const seen: string[] = [];
    for (const o of orders) {
      const v = cellValue(o, key);
      if (!seen.includes(v)) seen.push(v);
    }
    return seen;
  };

  const rows = useMemo(
    () =>
      orders.filter((o) => {
        if (tab !== "all" && o.status !== tab) return false;
        for (const [key, allowed] of Object.entries(cols)) {
          if (allowed && !allowed.has(cellValue(o, key as ColKey))) return false;
        }
        return true;
      }),
    [orders, tab, cols],
  );

  const setCol = (key: ColKey, next: Set<string> | null) =>
    setCols((prev) => {
      const copy = { ...prev };
      if (next === null) delete copy[key];
      else copy[key] = next;
      return copy;
    });

  const head = (key: ColKey, label: string, className?: string) => (
    <th className={className}>
      {label}
      <ColumnFilter
        label={label}
        options={optionsFor(key)}
        selected={cols[key] ?? null}
        onChange={(next) => setCol(key, next)}
      />
    </th>
  );

  return (
    <>
      <div className="masthead">
        <h1 className="compact" style={{ margin: 0 }}>Orders</h1>
        <span className="count-note">
          {rows.length} order{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} label="Filter orders by status" />

      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              {head("orderNumber", "Order")}
              {head("date", "Date")}
              {head("customerName", "Customer")}
              {head("channel", "Channel")}
              {head("total", "Total", "num")}
              {head("status", "Status")}
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr
                key={o.id}
                className="rowlink"
                onClick={() => router.push(`/orders/${o.orderNumber}`)}
              >
                <td className="cell-mono">{o.orderNumber}</td>
                <td className="cell-sub">{o.date}</td>
                <td className="cell-main">{o.customerName}</td>
                <td className="cell-sub" style={{ fontSize: 12.5 }}>{CHANNEL_LABEL[o.channel]}</td>
                <td className="num amount">{kr(o.totalOre)}</td>
                <td><OrderBadge status={o.status} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">
                  No orders match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
