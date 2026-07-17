"use client";

import { useState } from "react";
import StockAdjuster from "@/components/StockAdjuster";
import type { MockProduct } from "@/lib/mock";

/**
 * Owns the live stock count for the whole detail body.
 *
 * The count has to live above both columns: the adjuster sits on the left and
 * the AI suggestion on the right, and the suggestion is *derived* from the
 * count — raise stock above the threshold and the warning must vanish, because
 * a merchant clears an insight by fixing its cause (PRD §AI Assistant). The
 * source prototype left this card static, so its badge could read "In good
 * health" beside a card still demanding a reorder; deriving it removes that.
 */
export default function ProductBody({ product }: { product: MockProduct }) {
  const [stock, setStock] = useState(product.stockQuantity);
  const low = stock < product.lowStockThreshold;
  const peak = Math.max(...product.sold14);

  return (
    <div className="two-col two-col-product">
      <div>
        <StockAdjuster
          stock={stock}
          onChange={setStock}
          threshold={product.lowStockThreshold}
        />

        <div className="card-label" style={{ letterSpacing: "0.14em", marginBottom: 14 }}>
          Units sold · last 14 days
        </div>
        <div className="sold-chart" aria-hidden="true">
          {product.sold14.map((v, i) => {
            // Top of the range takes the accent; the middle band a softer tan.
            const ratio = v / peak;
            const cls = ratio >= 0.78 ? "hot" : ratio >= 0.58 ? "mid" : undefined;
            return <span key={i} className={cls} style={{ height: `${Math.round(ratio * 100)}%` }} />;
          })}
        </div>
      </div>

      <div className="stack">
        <div className="card">
          <div className="card-label" style={{ marginBottom: 6 }}>Details</div>
          <div className="kv"><span className="k">SKU</span><span className="v">{product.sku}</span></div>
          <div className="kv"><span className="k">Category</span><span className="v">{product.category}</span></div>
          <div className="kv"><span className="k">Threshold</span><span className="v">{product.lowStockThreshold} units</span></div>
          <div className="kv"><span className="k">Sold this week</span><span className="v">{product.soldThisWeek}</span></div>
        </div>

        {low && (
          <div className="alert-card">
            <div className="card-label">✦ AI suggestion</div>
            <div style={{ font: "500 17px/1.3 var(--font-serif), serif" }}>
              Reorder ~{Math.max(10, Math.ceil((product.lowStockThreshold * 4 - stock) / 10) * 10)} units
              before the weekend promo
            </div>
            <div style={{ font: "400 13px/1.45 var(--font-sans)", color: "var(--muted)", marginTop: 8 }}>
              Selling 3× its usual rate with only {stock} in stock — you risk a stockout during peak
              demand.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
