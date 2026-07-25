import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chaatwala-basic.vercel.app"),
  title: {
    default: "Chaatwala | Authentic Indian Street Food Delivered",
    template: "%s | Chaatwala",
  },
  description: "Authentic Indian street food and beverages delivered fresh to your doorstep.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://chaatwala-basic.vercel.app",
    siteName: "Chaatwala",
    title: "Chaatwala | Authentic Indian Street Food Delivered",
    description: "Authentic Indian street food and beverages delivered fresh to your doorstep.",
    images: [
      {
        url: "https://chaatwala-basic.vercel.app/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Chaatwala - Authentic Indian Street Food",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Chaatwala | Authentic Indian Street Food Delivered",
    description: "Authentic Indian street food and beverages delivered fresh to your doorstep.",
    images: ["https://chaatwala-basic.vercel.app/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
