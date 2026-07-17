"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import StockAdjuster from "@/components/StockAdjuster";
import { adjustStock } from "@/lib/actions/inventory";
import { lowStockRule } from "@/lib/insights/rules";
import type { getProductDetail } from "@/lib/queries/inventory";

type ProductDetail = NonNullable<Awaited<ReturnType<typeof getProductDetail>>>;

/**
 * Owns the live stock count for the whole detail body.
 *
 * The count has to live above both columns: the adjuster sits on the left and
 * the AI suggestion on the right, and the suggestion is *derived* from the
 * count via the same tested lowStockRule the dashboard uses (src/lib/insights/
 * rules.ts) — not a separate hand-invented formula. Raise stock above the
 * threshold and the warning must vanish, because a merchant clears an insight
 * by fixing its cause (PRD §AI Assistant).
 */
export default function ProductBody({ product, sold14, soldThisWeek }: { product: ProductDetail["product"]; sold14: number[]; soldThisWeek: number }) {
  const router = useRouter();
  const [stock, setStock] = useState(product.stockQuantity);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const peak = Math.max(...sold14, 1);

  const [insight] = lowStockRule([
    { id: product.id, name: product.name, stockQuantity: stock, lowStockThreshold: product.lowStockThreshold, soldLast7: soldThisWeek },
  ]);

  const handleChange = (next: number) => {
    const previous = stock;
    setStock(next); // optimistic — StockAdjuster and the AI card update immediately
    setError(null);
    startTransition(async () => {
      const result = await adjustStock(product.id, next);
      if (!result.ok) {
        setStock(previous);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="two-col two-col-product">
      <div>
        <StockAdjuster stock={stock} onChange={handleChange} threshold={product.lowStockThreshold} disabled={isPending} />
        {error && (
          <p style={{ color: "var(--crit)", font: "400 12px var(--font-sans)", marginTop: -14, marginBottom: 14 }}>
            {error}
          </p>
        )}
        {isPending && (
          <p style={{ color: "var(--faint)", font: "400 12px var(--font-sans)", marginTop: -14, marginBottom: 14 }}>
            Saving…
          </p>
        )}

        <div className="card-label" style={{ letterSpacing: "0.14em", marginBottom: 14 }}>
          Units sold · last 14 days
        </div>
        <div className="sold-chart" aria-hidden="true">
          {sold14.map((v, i) => {
            // Top of the range takes the accent; the middle band a softer tan.
            const ratio = v / peak;
            const cls = ratio >= 0.78 ? "hot" : ratio >= 0.58 ? "mid" : undefined;
            return <span key={i} className={cls} style={{ height: `${Math.max(2, Math.round(ratio * 100))}%` }} />;
          })}
        </div>
      </div>

      <div className="stack">
        <div className="card">
          <div className="card-label" style={{ marginBottom: 6 }}>Details</div>
          <div className="kv"><span className="k">SKU</span><span className="v">{product.sku}</span></div>
          <div className="kv"><span className="k">Category</span><span className="v">{product.category}</span></div>
          <div className="kv"><span className="k">Threshold</span><span className="v">{product.lowStockThreshold} units</span></div>
          <div className="kv"><span className="k">Sold this week</span><span className="v">{soldThisWeek}</span></div>
        </div>

        {insight && (
          <div className="alert-card">
            <div className="card-label">✦ AI suggestion</div>
            <div style={{ font: "500 17px/1.3 var(--font-serif), serif" }}>{insight.headline}</div>
            <div style={{ font: "400 13px/1.45 var(--font-sans)", color: "var(--muted)", marginTop: 8 }}>
              {insight.action}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
