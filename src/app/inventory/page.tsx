import InventoryTable from "./InventoryTable";
import { PRODUCTS } from "@/lib/mock";

export const metadata = { title: "Inventory — OpsHub" };

export default function InventoryPage() {
  return (
    <main className="page">
      <InventoryTable products={PRODUCTS} />
    </main>
  );
}
