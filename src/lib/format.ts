/** SEK formatting: öre in, "42 380 kr" out (sv-SE conventions, no decimals). */
export function kr(ore: number): string {
  const kronor = Math.round(ore / 100);
  return `${kronor.toLocaleString("sv-SE").replace(/ /g, " ")} kr`;
}

export function shortDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function shortDateTime(d: Date): string {
  return `${shortDate(d)} · ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`;
}

export function longToday(): string {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}
