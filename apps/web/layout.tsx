
import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShuttleMetrics | Badminton Performance Analyzer",
  description:
    "Track badminton matches, analyze player performance, and explore match predictions with ShuttleMetrics.",
  applicationName: "ShuttleMetrics",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f9fc",
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
