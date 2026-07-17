import OrdersTable from "./OrdersTable";
import { listOrders } from "@/lib/queries/orders";

export const metadata = { title: "Orders — OpsHub" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await listOrders();
  return (
    <main className="page">
      <OrdersTable orders={orders} />
    </main>
  );
}
