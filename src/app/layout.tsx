import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Newsreader } from "next/font/google";
import Rail from "@/components/Rail";
import Chrome from "@/components/Chrome";
import "./globals.css";

// Self-hosted by next/font — the prototype linked fonts.googleapis.com, which
// would cost a render-blocking round trip and leak a request per visitor.
const sans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});
const serif = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});
const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OpsHub — Merchant Operations Cockpit",
  description:
    "One calm screen for a small merchant's orders, stock, payments and the few things that need attention today.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body>
        <div className="shell">
          <Rail />
          <div className="col">
            <Chrome />
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
