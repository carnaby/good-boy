import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Good Boy",
  description: "Good Boy",
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
