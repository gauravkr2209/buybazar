import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import SiteHeader from "@/components/site-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PaisaPath — Compare with clarity",
  description:
    "A thoughtful India-first shopping comparison concept. Explore fictional demo products, seller comparisons, and price history.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-IN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
    >
      <body id="top" className="min-h-full flex flex-col">
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <Link className="brand brand--footer" href="/" aria-label="PaisaPath home">
            <span className="brand__mark" aria-hidden="true">p</span>
            <span className="brand__name">paisapath<span>.</span></span>
          </Link>
          <p>Compare thoughtfully. Choose confidently.</p>
          <span className="site-footer__copyright">© 2026 PaisaPath concept</span>
        </footer>
      </body>
    </html>
  );
}
