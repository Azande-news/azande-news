import type { Metadata } from "next";
import { Work_Sans, Space_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BreakingBar from "@/components/BreakingBar";
import Footer from "@/components/Footer";
import DarkModeToggle from "@/components/DarkModeToggle";

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Azande News — by and for the Azande people, worldwide",
    template: "%s · Azande News",
  },
  description:
    "A community news and information site for the Azande people of DR Congo, South Sudan, the Central African Republic, and the worldwide diaspora — news, culture, history, and the Zande language.",
  metadataBase: new URL("https://azande-news.vercel.app"),
  keywords: ["Azande", "Zande", "South Sudan news", "DR Congo news", "Central African Republic", "Azande diaspora", "Zande language", "Zande dictionary", "Western Equatoria", "Yambio"],
  alternates: {
    types: { "application/rss+xml": "/feed.xml" },
  },
  openGraph: {
    title: "Azande News",
    description:
      "News, culture, and voices from the Azande people of DR Congo, South Sudan, the Central African Republic, and the diaspora around the world.",
    url: "https://azande-news.vercel.app",
    siteName: "Azande News",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Azande News",
    description:
      "News, culture, and voices from the Azande people of DR Congo, South Sudan, the Central African Republic, and the diaspora around the world.",
  },
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem("theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <link rel="alternate" type="application/rss+xml" title="Azande News RSS Feed" href="/feed.xml" />
      </head>
      <body
        className={`${workSans.variable} ${spaceMono.variable} font-body bg-paper text-ink transition-colors`}
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] bg-accent text-white px-4 py-2 rounded-sm text-sm font-medium">
          Skip to main content
        </a>
        <Navbar />
        <BreakingBar />
        <main id="main-content" className="max-w-6xl mx-auto px-4 sm:px-6 py-8 min-h-[60vh]">
          {children}
        </main>
        <Footer />
        <DarkModeToggle />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}


