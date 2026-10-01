import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tiro de Guerra - Escalas",
  description: "Sistema de gerenciamento de escalas do Tiro de Guerra",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-military-gray text-military-dark antialiased">{children}</body>
    </html>
  );
}
