import InventoryTable from "./InventoryTable";
import { listProducts } from "@/lib/queries/inventory";

export const metadata = { title: "Inventory — OpsHub" };
export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const products = await listProducts();
  return (
    <main className="page">
      <InventoryTable products={products} />
    </main>
  );
}
