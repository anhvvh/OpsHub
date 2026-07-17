"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Icons are the prototype's own paths, kept verbatim so the rail reads
// identically. Stroke styling lives in globals.css (.rail-ico svg).
const NAV = [
  {
    href: "/",
    label: "Dashboard",
    match: (p: string) => p === "/",
    icon: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
  },
  {
    href: "/orders",
    label: "Orders",
    match: (p: string) => p.startsWith("/orders"),
    icon: (
      <>
        <path d="M7 4h10a1 1 0 0 1 1 1v15l-3-2-3 2-3-2-3 2V5a1 1 0 0 1 1-1z" />
        <line x1="9" y1="9" x2="15" y2="9" />
        <line x1="9" y1="13" x2="15" y2="13" />
      </>
    ),
  },
  {
    href: "/inventory",
    label: "Inventory",
    match: (p: string) => p.startsWith("/inventory"),
    icon: (
      <>
        <path d="M21 8l-9-5-9 5v8l9 5 9-5z" />
        <path d="M3 8l9 5 9-5" />
        <line x1="12" y1="13" x2="12" y2="22" />
      </>
    ),
  },
  {
    href: "/payments",
    label: "Payments",
    match: (p: string) => p.startsWith("/payments"),
    icon: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
        <line x1="6" y1="15" x2="10" y2="15" />
      </>
    ),
  },
];

export default function Rail() {
  const pathname = usePathname();

  return (
    <aside className="rail">
      <div className="rail-logo" aria-hidden="true">
        O
      </div>
      <nav className="rail-nav" aria-label="Main">
        {NAV.map((item) => {
          const on = item.match(pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rail-ico${on ? " on" : ""}`}
              title={item.label}
              aria-label={item.label}
              aria-current={on ? "page" : undefined}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                {item.icon}
              </svg>
            </Link>
          );
        })}
      </nav>
      <div className="rail-avatar" title="Hälsa Skincare" aria-hidden="true">
        H
      </div>
    </aside>
  );
}
