import { AnalyticsScripts } from "@/components/AnalyticsScripts";
import { SiteContentProvider } from "@/components/SiteContentProvider";
import type { Metadata } from "next";
import { Lora, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const bodyFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const headingFont = Lora({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

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
      <body className={`${bodyFont.variable} ${headingFont.variable} min-h-screen overflow-x-hidden bg-white antialiased text-slate-900`}>
        <AnalyticsScripts />
        <SiteContentProvider>{children}</SiteContentProvider>
      </body>
    </html>
  );
}
