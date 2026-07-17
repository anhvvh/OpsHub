"use client";

/**
 * Stock stepper. Controlled: the count is owned by ProductBody, because the AI
 * suggestion in the other column derives from the same number and the two must
 * never disagree. The low-stock verdict is recomputed on every render rather
 * than stored, so badge, bar and colour cannot drift from the count.
 */
export default function StockAdjuster({
  stock,
  onChange,
  threshold,
  disabled = false,
}: {
  stock: number;
  onChange: (next: number) => void;
  threshold: number;
  /** True while a write is in flight — blocks a second click before the first's
   * round trip re-renders `stock`, which would otherwise both compute from the
   * same stale value and net +1 instead of +2. */
  disabled?: boolean;
}) {
  const low = stock < threshold;

  // Full bar at twice the threshold: the line sits at the visual midpoint.
  const fillPct = Math.min(100, Math.round((stock / (threshold * 2)) * 100));

  return (
    <div className="card" style={{ padding: 24, borderRadius: 14, marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span className="card-label" style={{ marginBottom: 0 }}>Current stock</span>
        <span
          className="badge"
          style={{
            background: low ? "var(--crit-badge)" : "var(--ok-badge-bg)",
            color: low ? "var(--crit-soft)" : "var(--ok-badge-fg)",
          }}
        >
          ● {low ? "Below threshold" : "In good health"}
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
        <span
          className="stock-count"
          style={{ color: low ? "var(--crit)" : "var(--ink)" }}
          aria-live="polite"
        >
          {stock}
        </span>
        <span style={{ font: "400 14px var(--font-sans)", color: "var(--faint)", marginBottom: 8 }}>
          units · threshold {threshold}
        </span>
      </div>

      <div className="stockbar-track">
        <div
          className="stockbar-fill"
          style={{ width: `${fillPct}%`, background: low ? "var(--crit)" : "var(--ok-bright)" }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span className="adjust-label">Adjust</span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            className="stepper"
            aria-label="Decrease stock by one"
            onClick={() => onChange(Math.max(0, stock - 1))}
            disabled={disabled || stock === 0}
          >
            −
          </button>
          <button
            type="button"
            className="stepper"
            aria-label="Increase stock by one"
            onClick={() => onChange(stock + 1)}
            disabled={disabled}
          >
            +
          </button>
        </div>
        <span style={{ font: "400 11.5px/1.4 var(--font-sans)", color: "var(--faint)", flex: 1 }}>
          Low-stock alert re-evaluates instantly as you adjust.
        </span>
      </div>
    </div>
  );
}
