"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ALLOWED_TRANSITIONS, STATUS_LABELS, type OrderStatus } from "@/lib/domain";
import { updateOrderStatus } from "@/lib/actions/orders";

/**
 * Status switcher. Only transitions allowed by the domain's lifecycle are
 * offered, so the UI cannot express an illegal move (e.g. Delivered -> Paid).
 * Calls the real, tested updateOrderStatus server action and refreshes the
 * page so the badge, timeline, and this control all reflect the persisted row.
 */
export default function StatusChips({ orderId, initial }: { orderId: string; initial: OrderStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const next = ALLOWED_TRANSITIONS[initial];

  const handleClick = (nextStatus: OrderStatus) => {
    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(orderId, nextStatus);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="card" style={{ background: "#f7f0e4", border: "1px solid rgba(38,35,29,.1)" }}>
      <div className="card-label" style={{ marginBottom: 12 }}>Update status</div>
      <div className="chips">
        <span className="chip current">{STATUS_LABELS[initial]}</span>
        {next.map((s) => (
          <button
            key={s}
            type="button"
            className="chip"
            onClick={() => handleClick(s)}
            disabled={isPending}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 10, font: "400 11.5px/1.4 var(--font-sans)", color: error ? "var(--crit)" : "var(--faint)" }}>
        {error
          ? error
          : next.length > 0
            ? "Changes append to the timeline and persist."
            : "This order has reached a final state."}
      </div>
    </div>
  );
}
