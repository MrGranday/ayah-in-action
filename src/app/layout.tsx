import type { Metadata } from "next";
import { Inter, Amiri, Newsreader } from "next/font/google";
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

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  style: ["normal", "italic"],
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
  // Apple PWA meta
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Ayah in Action',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export const viewport = {
  themeColor: '#0a6650',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

import { getServerSession } from '@/lib/session';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession();

  return (
    <html
      lang={session.isoCode || "en"}
      dir={session.direction || "ltr"}
      className={`${inter.variable} ${amiri.variable} ${newsreader.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Apple Touch Icon */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icons/icon-512.png" />

        {/* 
          Capture the beforeinstallprompt event BEFORE React hydrates.
          Without this, the event fires before any React component 
          can register a listener and is silently discarded forever.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window._pwaInstallEvent = null;
              window.addEventListener('beforeinstallprompt', function(e) {
                e.preventDefault();
                window._pwaInstallEvent = e;
                // Dispatch a custom event so any mounted React component can react
                window.dispatchEvent(new CustomEvent('pwa-install-ready'));
              });
              window.addEventListener('appinstalled', function() {
                window._pwaInstallEvent = null;
                window.dispatchEvent(new CustomEvent('pwa-installed'));
              });
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
