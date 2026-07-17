"use client";

import { useState } from "react";
import { ALLOWED_TRANSITIONS, STATUS_LABELS, type OrderStatus } from "@/lib/domain";

/**
 * Status switcher. Only transitions allowed by the domain's lifecycle are
 * offered, so the UI cannot express an illegal move (e.g. Delivered -> Paid).
 * While on mock data the change is local; the write path lands here later.
 */
export default function StatusChips({ initial }: { initial: OrderStatus }) {
  const [status, setStatus] = useState<OrderStatus>(initial);
  const next = ALLOWED_TRANSITIONS[status];

  return (
    <div className="card" style={{ background: "#f7f0e4", border: "1px solid rgba(38,35,29,.1)" }}>
      <div className="card-label" style={{ marginBottom: 12 }}>Update status</div>
      <div className="chips">
        <span className="chip current">{STATUS_LABELS[status]}</span>
        {next.map((s) => (
          <button key={s} type="button" className="chip" onClick={() => setStatus(s)}>
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>
      <div style={{ marginTop: 10, font: "400 11.5px/1.4 var(--font-sans)", color: "var(--faint)" }}>
        {next.length > 0
          ? "Changes append to the timeline and persist."
          : "This order has reached a final state."}
      </div>
    </div>
  );
}
