import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import SearchBox from "@/components/SearchBox";
import SiteMenu from "@/components/SiteMenu";

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
      <div className="bg-[#1A1A1A] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Image src="/logo.png" alt="Azande News" width={36} height={36} className="rounded-sm shrink-0" priority />
            <span className="font-display text-lg sm:text-2xl font-bold tracking-tight truncate">
              Azande News
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <SiteMenu user={!!user} isAdmin={isAdmin} />
            {user ? (
              <>
                <Link
                  href="/posts/new"
                  className="hidden sm:inline bg-accent hover:bg-accent-light transition-colors px-3 py-1.5 rounded-sm text-sm font-medium"
                >
                  Write a post
                </Link>
                <LogoutButton />
              </>
            ) : (
              <>
                <Link href="/login" className="hidden sm:inline text-white/80 hover:text-white transition-colors text-sm font-medium">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="bg-accent hover:bg-accent-light transition-colors px-3 py-1.5 rounded-sm text-sm font-medium"
                >
                  Join
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="bg-paper border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}
