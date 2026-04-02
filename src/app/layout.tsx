import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sai Gold Loans CRM",
  description: "Secure Gold Loan Management System",
  icons: {
    icon: [
      { url: '/icon.png' },
      { url: '/favicon.png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
