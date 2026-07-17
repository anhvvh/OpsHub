"use client";

export type Tab = { key: string; label: string };

export default function Tabs({
  tabs,
  active,
  onChange,
  label,
}: {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  label: string;
}) {
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={t.key === active}
          className={`tab${t.key === active ? " on" : ""}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
