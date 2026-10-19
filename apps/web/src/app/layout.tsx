
import type { Metadata } from "next";
import "../../../globals.css";

export const metadata: Metadata = {
  title: "ShuttleMetrics",
  description: "Badminton Player Performance Analyzer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
