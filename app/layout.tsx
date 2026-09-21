import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gnana Saraswati Jr. College | Bethamcherla",
  description: "Gnana Saraswati Jr. College, Bethamcherla — college portal demo.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
