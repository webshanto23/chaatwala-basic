import type { Metadata } from "next";
import { Geist, Geist_Mono, Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["600", "900"],
  variable: "--font-fraunces",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://chaatwala-basic.vercel.app"),
  title: {
    default: "Chaatwala | Authentic Indian Street Food Delivered",
    template: "%s | Chaatwala",
  },
  icons: {
    icon: "/images/chatwala_logo.png",
  },

  description:
    "Authentic Indian street food and beverages delivered fresh to your doorstep.",
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
    description:
      "Authentic Indian street food and beverages delivered fresh to your doorstep.",
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
    description:
      "Authentic Indian street food and beverages delivered fresh to your doorstep.",
    images: ["https://chaatwala-basic.vercel.app/og-image.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "Chaatwala",
    url: "https://chaatwala-basic.vercel.app",
    logo: "https://chaatwala-basic.vercel.app/images/chatwala_logo.png",
    servesCuisine: ["Indian Street Food", "Fast Food"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Dhaka, Bangladesh",
      addressLocality: "Dhaka",
      addressCountry: "Bangladesh",
    },
    telephone: "+8801335100511",
  };

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable}${fraunces.variable} ${inter.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col">
        <AppShell>{children}</AppShell>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd),
          }}
        />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
