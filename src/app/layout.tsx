import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ELIE SAAB Style Challenge",
  description: "ELIE SAAB styling game experience",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  console.log('🏠 ROOT LAYOUT: Rendering layout with children');
  
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className="min-h-screen antialiased bg-background text-foreground"
      >
        {children}
      </body>
    </html>
  );
}
