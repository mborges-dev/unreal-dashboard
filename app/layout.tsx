import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "UNREAL Performance Dashboard",
  description: "Gestão de leads, propostas e finanças",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt" className="dark">
      <body className="min-h-screen bg-bg text-fg antialiased">{children}</body>
    </html>
  );
}
