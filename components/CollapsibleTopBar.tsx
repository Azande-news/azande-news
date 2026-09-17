"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import AccountMenu from "@/components/AccountMenu";

export default function CollapsibleTopBar({
  isLoggedIn,
  isAdmin,
}: {
  isLoggedIn: boolean;
  isAdmin: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`bg-[#1A1A1A] text-white transition-[height] duration-200 ease-in-out ${
        scrolled ? "h-10" : "h-14"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Image
            src="/logo.png"
            alt="Azande News"
            width={36}
            height={36}
            className={`rounded-sm shrink-0 transition-all duration-200 ${
              scrolled ? "w-6 h-6" : "w-9 h-9"
            }`}
            priority
          />
          <span
            className={`font-display font-bold tracking-tight truncate transition-all duration-200 ${
              scrolled ? "text-base sm:text-lg" : "text-lg sm:text-2xl"
            }`}
          >
            Azande News
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-sm font-medium">
          {isLoggedIn ? (
            <>
              <Link
                href="/posts/new"
                className={`bg-accent hover:bg-accent-light transition-colors rounded-sm ${
                  scrolled ? "px-2 py-1 text-xs" : "px-3 py-1.5"
                }`}
              >
                Write a post
              </Link>
              <AccountMenu isAdmin={isAdmin} />
            </>
          ) : (
            <>
              <Link href="/login" className="text-white/80 hover:text-white transition-colors">
                Log in
              </Link>
              <Link
                href="/register"
                className={`bg-accent hover:bg-accent-light transition-colors rounded-sm ${
                  scrolled ? "px-2 py-1 text-xs" : "px-3 py-1.5"
                }`}
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
