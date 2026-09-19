import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import MainNav from "@/components/MainNav";
import AccountMenu from "@/components/AccountMenu";
import HeaderSearchToggle from "@/components/HeaderSearchToggle";

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
      <div className="bg-black text-white border-b border-white/15">
        <div className="max-w-shell mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2 min-w-0">
            <Image src="/logo.png" alt="Azande News" width={32} height={32} className="shrink-0" priority />
            <span className="font-meta text-lg sm:text-xl font-extrabold tracking-tight truncate">
              Azande News
            </span>
          </Link>

          <div className="flex items-center gap-3 shrink-0 font-meta text-brevier font-semibold">
            <HeaderSearchToggle />
            {user ? (
              <>
                <Link
                  href="/posts/new"
                  className="hidden sm:inline-block border border-white/40 hover:bg-white hover:text-black transition-colors px-3 py-1.5"
                >
                  Write a post
                </Link>
                <AccountMenu isAdmin={isAdmin} />
              </>
            ) : (
              <>
                <Link href="/login" className="text-white/80 hover:text-white transition-colors">
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="border border-white/40 hover:bg-white hover:text-black transition-colors px-3 py-1.5"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      <MainNav />
    </header>
  );
}

