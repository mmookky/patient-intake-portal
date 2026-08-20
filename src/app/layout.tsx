import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patient Intake Portal | Real-time Care Coordination",
  description:
    "A responsive patient intake portal with real-time staff monitoring.",
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
