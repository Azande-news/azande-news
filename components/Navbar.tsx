import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import SearchBox from "@/components/SearchBox";
import { CATEGORIES } from "@/lib/categories";

export default async function Navbar() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  return (
    <header className="sticky top-0 z-50">
      {/* Masthead */}
      <div className="bg-[#1A1A1A] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Azande News" width={36} height={36} className="rounded-sm" priority />
            <span className="font-display text-xl sm:text-2xl font-bold tracking-tight">
              Azande News
            </span>
            <span className="hidden sm:inline font-meta text-[10px] tracking-[0.2em] uppercase text-white/50">
              DR Congo &middot; South Sudan &middot; CAR
            </span>
          </Link>

          <nav className="flex items-center gap-3 text-sm font-medium">
            {user ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="hidden sm:inline text-white/80 hover:text-white transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/bookmarks"
                  className="hidden sm:inline text-white/80 hover:text-white transition-colors"
                >
                  Saved
                </Link>
                <Link
                  href="/posts/new"
                  className="bg-accent hover:bg-accent-light transition-colors px-3 py-1.5 rounded-sm"
                >
                  Write a post
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-white/80 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="bg-accent hover:bg-accent-light transition-colors px-3 py-1.5 rounded-sm"
                >
                  Join &mdash; it&apos;s free
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Category strip */}
      <div className="bg-paper border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
            <Link
              href="/"
              className="shrink-0 py-3 text-sm font-semibold text-ink border-b-2 border-accent"
            >
              Home
            </Link>
            <Link
              href="/azande-people"
              className="shrink-0 py-3 text-sm font-medium text-grey hover:text-ink border-b-2 border-transparent hover:border-accent transition-colors"
            >
              The Azande People
            </Link>
            {CATEGORIES.map((c) => (
              <Link
                key={c.value}
                href={`/category/${c.value}`}
                className="shrink-0 py-3 text-sm font-medium text-grey hover:text-ink border-b-2 border-transparent hover:border-accent transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
          <SearchBox />
        </div>
      </div>
    </header>
  );
}










