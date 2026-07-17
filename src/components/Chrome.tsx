"use client";

import { usePathname } from "next/navigation";

/** "/orders/OH-1082" -> "orders / OH-1082"; "/" -> "dashboard". */
function routeLabel(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean).map(decodeURIComponent);
  return segments.length === 0 ? "dashboard" : segments.join(" / ");
}

export default function Chrome() {
  return (
    <div className="chrome">
      <i style={{ background: "#e0a89a" }} />
      <i style={{ background: "#e6d3a0" }} />
      <i style={{ background: "#a9c2a3" }} />
      <span className="route">opshub.app / {routeLabel(usePathname())}</span>
    </div>
  );
}
