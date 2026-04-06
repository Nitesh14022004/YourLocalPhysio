import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Your Local Physio",
  description: "Physiotherapy home visits",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white antialiased text-slate-900">
        {children}
      </body>
    </html>
  );
}
