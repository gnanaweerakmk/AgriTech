import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgriTech Governance",
  description: "AgriTech access and payment oversight",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
