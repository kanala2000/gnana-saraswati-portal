import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Gnana Saraswati Jr. College | Bethamcherla", template: "%s | Gnana Saraswati Jr. College" },
  description: "Gnana Saraswati Junior College, Bethamcherla — academic information and secure student, faculty and management portal.",
  keywords: ["Gnana Saraswati Junior College", "Bethamcherla", "Junior College", "Intermediate", "College Portal"],
  openGraph: { title: "Gnana Saraswati Jr. College | Bethamcherla", description: "College website and secure academic portal.", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
