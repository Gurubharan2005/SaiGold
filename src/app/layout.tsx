import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google"; // High-Performance Font Loading
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap", // Immediate text rendering
  variable: "--font-outfit",
});

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={outfit.className}>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
