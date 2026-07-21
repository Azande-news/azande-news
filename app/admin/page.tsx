import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminPostsTable from "@/components/admin/AdminPostsTable";
import AdminUsersTable from "@/components/admin/AdminUsersTable";
import AdminReportsTable from "@/components/admin/AdminReportsTable";

export const revalidate = 0;

export default async function AdminPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (myProfile?.role !== "admin") {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <h1 className="font-display text-3xl font-bold text-ink mb-4">
          Admins only
        </h1>
        <p className="font-body text-grey">
          You don&apos;t have access to this page. If you think this is a
          mistake, ask an existing admin to promote your account from the
          Supabase dashboard.
        </p>
      </div>
    );
  }

  const [{ data: posts }, { data: profiles }, { data: reports }] =
    await Promise.all([
      supabase
        .from("posts")
        .select("id, title, status, category, created_at, profiles(display_name, username)")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, username, display_name, role, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("reports")
        .select("id, reason, status, created_at, post_id, posts(title)")
        .eq("status", "open")
        .order("created_at", { ascending: false }),
    ]);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-ink mb-1">
        Admin dashboard
      </h1>
      <p className="font-body text-grey mb-12">
        Moderate posts, manage user roles, and review reports.
      </p>

      <section className="mb-14">
        <h2 className="font-display text-xl font-bold text-ink border-l-4 border-accent pl-3 mb-4">
          Open reports
        </h2>
        <AdminReportsTable reports={(reports ?? []) as any} />
      </section>

      <section className="mb-14">
        <h2 className="font-display text-xl font-bold text-ink border-l-4 border-accent pl-3 mb-4">
          All posts ({posts?.length ?? 0})
        </h2>
        <AdminPostsTable posts={(posts ?? []) as any} />
      </section>

      <section>
        <h2 className="font-display text-xl font-bold text-ink border-l-4 border-accent pl-3 mb-4">
          Users ({profiles?.length ?? 0})
        </h2>
        <AdminUsersTable profiles={(profiles ?? []) as any} currentUserId={user.id} />
      </section>
    </div>
  );
}
