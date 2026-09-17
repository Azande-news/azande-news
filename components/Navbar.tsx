import { createClient } from "@/lib/supabase/server";
import SearchBox from "@/components/SearchBox";
import MainNav from "@/components/MainNav";
import CollapsibleTopBar from "@/components/CollapsibleTopBar";

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
      <CollapsibleTopBar isLoggedIn={!!user} isAdmin={isAdmin} />
      <MainNav />
      <div className="bg-offwhite border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5">
          <SearchBox />
        </div>
      </div>
    </header>
  );
}
