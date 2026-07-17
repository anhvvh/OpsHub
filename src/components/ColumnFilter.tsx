"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The prototype's per-column caret filter: a checkbox popover listing that
 * column's distinct values. `selected === null` means "no filter" (all shown);
 * checking every box collapses back to null so the caret stops reading active.
 */
export default function ColumnFilter({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: Set<string> | null;
  onChange: (next: Set<string> | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const isChecked = (v: string) => selected === null || selected.has(v);

  const toggle = (v: string) => {
    const next = new Set(selected ?? options);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    onChange(next.size === options.length ? null : next);
  };

  return (
    <span className="hcaret-wrap" ref={wrap}>
      <button
        type="button"
        className={`hcaret${selected ? " act" : ""}`}
        aria-label={`Filter by ${label}`}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ▾
      </button>

      {open && (
        <div className="colpop" role="dialog" aria-label={`Filter by ${label}`}>
          <div className="pw-hd">
            <button type="button" onClick={() => onChange(null)}>Select all</button>
            <button type="button" onClick={() => onChange(new Set())}>Clear</button>
          </div>
          {options.map((v) => (
            <label key={v}>
              <input type="checkbox" checked={isChecked(v)} onChange={() => toggle(v)} />
              {v}
            </label>
          ))}
        </div>
      )}
    </span>
  );
}
