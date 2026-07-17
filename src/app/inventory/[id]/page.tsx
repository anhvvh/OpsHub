import Link from "next/link";
import { notFound } from "next/navigation";
import ProductBody from "./ProductBody";
import { getProductDetail } from "@/lib/queries/inventory";
import { kr } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getProductDetail(decodeURIComponent(id));
  if (!detail) notFound();
  const { product, sold14, soldThisWeek } = detail;

  return (
    <main className="page detail">
      <Link className="backlink" href="/inventory">← Inventory</Link>

      <header className="masthead">
        <div>
          <div className="kicker" style={{ letterSpacing: "0.16em" }}>{product.sku}</div>
          <h1 className="compact">{product.name}</h1>
        </div>
        {product.promoPriceOre && (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
            <div>
              <div style={{ font: "400 20px var(--font-serif), serif", color: "var(--faint)", textDecoration: "line-through" }}>
                {kr(product.priceOre)}
              </div>
              <div className="price-caption">ORIGINAL PRICE</div>
            </div>
            <div>
              <div style={{ font: "500 28px var(--font-serif), serif", color: "var(--accent)" }}>
                {kr(product.promoPriceOre)}
              </div>
              <div className="price-caption" style={{ color: "var(--accent)" }}>PROMOTIONAL PRICE</div>
            </div>
          </div>
        )}
      </header>

      <ProductBody product={product} sold14={sold14} soldThisWeek={soldThisWeek} />
    </main>
  );
}
