import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sai Gold Loans CRM",
  description: "Secure Gold Loan Management System",
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
