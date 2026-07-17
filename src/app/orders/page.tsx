import OrdersTable from "./OrdersTable";
import { ORDERS } from "@/lib/mock";

export const metadata = { title: "Orders — OpsHub" };

export default function OrdersPage() {
  return (
    <main className="page">
      <OrdersTable orders={ORDERS} />
    </main>
  );
}
