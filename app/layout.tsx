import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import BreakingBar from "@/components/BreakingBar";
import Footer from "@/components/Footer";
import DarkModeToggle from "@/components/DarkModeToggle";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Azande News - by and for the Azande people, worldwide",
    template: "%s - Azande News",
  },
  description:
    "A community news and information site for the Azande people of DR Congo, South Sudan, the Central African Republic, and the worldwide diaspora - news, culture, history, and the Zande language.",
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
    var theme = stored || "light";
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
        className={`${inter.variable} ${sourceSerif.variable} font-ui bg-paper text-ink`}
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] bg-ink text-white px-4 py-2 text-sm font-medium">
          Skip to main content
        </a>
        <Navbar />
        <BreakingBar />
        <main id="main-content" className="max-w-shell mx-auto px-4 sm:px-6 lg:px-8 py-6 min-h-[60vh]">
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


