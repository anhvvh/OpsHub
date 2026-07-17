import Link from "next/link";
import { notFound } from "next/navigation";
import ProductBody from "./ProductBody";
import { PRODUCTS, productBySku } from "@/lib/mock";
import { kr } from "@/lib/format";

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ id: p.sku }));
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = productBySku(decodeURIComponent(id));
  if (!product) notFound();

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

      <ProductBody product={product} />
    </main>
  );
}
