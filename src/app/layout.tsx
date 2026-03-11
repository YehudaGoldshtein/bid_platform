import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BidMaster",
  description: "Quote Management Platform for Contractors",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
