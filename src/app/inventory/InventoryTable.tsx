"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Tabs from "@/components/Tabs";
import { isLow, type MockProduct } from "@/lib/mock";
import { kr } from "@/lib/format";

const TABS = [
  { key: "all", label: "All products" },
  { key: "low", label: "Low stock" },
  { key: "ok", label: "In good health" },
];

export default function InventoryTable({ products }: { products: MockProduct[] }) {
  const router = useRouter();
  const [tab, setTab] = useState("all");

  const rows = useMemo(
    () =>
      products.filter((p) => {
        if (tab === "low") return isLow(p);
        if (tab === "ok") return !isLow(p);
        return true;
      }),
    [products, tab],
  );

  return (
    <>
      <div className="masthead">
        <h1 className="compact" style={{ margin: 0 }}>Inventory</h1>
        <span className="count-note">
          {rows.length} product{rows.length === 1 ? "" : "s"}
        </span>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} label="Filter products by stock health" />

      <div className="table-scroll">
        <table className="data">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th className="num">Promotional Price</th>
              <th className="num">Original Price</th>
              <th className="num">Threshold</th>
              <th className="num">Stock</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const low = isLow(p);
              // Amber once inside the last third above the line, red below it.
              const stockColour = low
                ? p.stockQuantity <= p.lowStockThreshold / 2
                  ? "var(--crit)"
                  : "var(--warn)"
                : "var(--ink)";
              return (
                <tr
                  key={p.id}
                  className={`rowlink${low ? " low" : ""}`}
                  onClick={() => router.push(`/inventory/${p.sku}`)}
                >
                  <td>
                    <div className="cell-main">{p.name}</div>
                    {low && (
                      <div style={{ font: "500 10.5px var(--font-sans)", color: "var(--crit)", marginTop: 2 }}>
                        ● Low stock
                      </div>
                    )}
                  </td>
                  <td className="cell-mono-dim">{p.sku}</td>
                  <td className="num" style={{ font: "500 13.5px var(--font-sans)", color: "var(--accent)" }}>
                    {p.promoPriceOre ? kr(p.promoPriceOre) : "—"}
                  </td>
                  <td className="num" style={{ font: "400 13px var(--font-sans)", color: "var(--faint)", textDecoration: "line-through" }}>
                    {kr(p.priceOre)}
                  </td>
                  <td className="num cell-sub">{p.lowStockThreshold}</td>
                  <td className="num" style={{ font: "500 16px var(--font-serif), serif", color: stockColour }}>
                    {p.stockQuantity}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="empty-row">No products match this filter.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
