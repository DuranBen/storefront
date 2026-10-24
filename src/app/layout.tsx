import type { Metadata } from "next";
import { Bodoni_Moda, Geist } from "next/font/google";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import "./globals.css";

// UI and body copy.
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Display headlines only (see `display`, `heading` utilities).
const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni-moda",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: {
    default: "Atelier — Luxury fashion, leather goods and jewellery",
    template: "%s | Atelier",
  },
  description:
    "Ready-to-wear, handbags, shoes and jewellery, made with care and built to last.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${bodoniModa.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
