import type { Metadata } from "next";
import { Work_Sans, Space_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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
  title: "Azande News — by and for the Azande people, worldwide",
  description:
    "A community news and information site for the Azande people of Western Equatoria, South Sudan, and the worldwide diaspora.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${workSans.variable} ${spaceMono.variable} font-body bg-paper`}
      >
        <Navbar />
        <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 min-h-[60vh]">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
