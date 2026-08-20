import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patient Intake Portal | Agnos Candidate Assignment",
  description:
    "A front-end candidate assignment demonstrating real-time patient intake and staff monitoring.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
