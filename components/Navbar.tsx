import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";

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
    <header className="border-b border-forest/15">
      <div className="max-w-5xl mx-auto px-5 py-5 flex items-center justify-between">
        <Link href="/" className="group">
          <div className="font-meta text-[11px] tracking-[0.25em] text-clay uppercase">
            Western Equatoria &middot; South Sudan &middot; Worldwide
          </div>
          <div className="font-display text-3xl sm:text-4xl font-medium text-forest -mt-0.5">
            Azande News
          </div>
        </Link>

        <nav className="flex items-center gap-4 font-body text-sm">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="text-forest hover:text-clay transition-colors"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/posts/new"
                className="bg-clay text-ivory px-4 py-2 rounded-sm hover:bg-forest transition-colors"
              >
                Write a post
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-forest hover:text-clay transition-colors">
                Log in
              </Link>
              <Link
                href="/register"
                className="bg-forest text-ivory px-4 py-2 rounded-sm hover:bg-forest-light transition-colors"
              >
                Join &mdash; it's free
              </Link>
            </>
          )}
        </nav>
      </div>
      <div className="woven-divider" />
    </header>
  );
}
