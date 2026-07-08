import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import { ConflictProvider } from "@/lib/conflicts/context";

export const metadata: Metadata = {
  title: "IRONSIGHT // OSINT Command Center",
  description:
    "Real-time OSINT dashboard aggregating free, public open-source intelligence across two conflict theaters (Iran/Israel and Russia/Ukraine): news, Telegram, air-raid alerts, live drone/missile tracking, military aircraft, naval, markets, and satellite thermal detection. All data belongs to its respective providers.",
  applicationName: "IRONSIGHT",
  keywords: [
    "OSINT",
    "dashboard",
    "Iran",
    "Israel",
    "Russia",
    "Ukraine",
    "conflict monitor",
    "air raid alerts",
    "drone tracker",
  ],
  authors: [{ name: "Nobler Works", url: "https://noblerworks.com/" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="scanlines antialiased">
        <ConflictProvider>
          {children}
        </ConflictProvider>
      </body>
    </html>
  );
}
