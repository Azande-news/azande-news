import type { Metadata } from "next";
import { Work_Sans, Space_Mono } from "next/font/google";
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
    "A community news and information site for the Azande people of Western Equatoria, South Sudan, and the worldwide diaspora.",
  metadataBase: new URL("https://azande-news.vercel.app"),
  alternates: {
    types: { "application/rss+xml": "/feed.xml" },
  },
  openGraph: {
    title: "Azande News",
    description:
      "News, culture, and voices from the Azande people of Western Equatoria and the diaspora around the world.",
    url: "https://azande-news.vercel.app",
    siteName: "Azande News",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Azande News",
    description:
      "News, culture, and voices from the Azande people of Western Equatoria and the diaspora around the world.",
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
        <Navbar />
        <BreakingBar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 min-h-[60vh]">
          {children}
        </main>
        <Footer />
        <DarkModeToggle />
      </body>
    </html>
  );
}
