import type { Metadata } from "next";
import { Inter, Amiri } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: 'Ayah in Action',
    template: '%s | Ayah in Action',
  },
  description: 'Track how Quran ayahs transform your daily life. Log real-life applications, build streaks, and see your Quran journey grow.',
  keywords: ['Quran', 'Islamic app', 'Quran application', 'Muslim life tracker', 'ayah journal'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://ayahinaction.app',
    siteName: 'Ayah in Action',
    images: [
      {
        url: '/icons/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Ayah in Action Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ayah in Action',
    description: 'Track how Quran ayahs transform your daily life.',
    images: ['/icons/icon-512.png'],
  },
  manifest: '/manifest.webmanifest',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${amiri.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
