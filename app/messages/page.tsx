import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const revalidate = 0;

export default async function MessagesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/messages");

  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, user_a, user_b, requested_by, status, updated_at")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .order("updated_at", { ascending: false });

  const list = conversations ?? [];
  const otherIds = list.map((c) => (c.user_a === user.id ? c.user_b : c.user_a));

  let profileMap: Record<string, { display_name: string; username: string }> = {};
  if (otherIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, username")
      .in("id", otherIds);
    profileMap = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]));
  }

  const pending = list.filter((c) => c.status === "pending" && c.requested_by !== user.id);
  const accepted = list.filter((c) => c.status === "accepted");
  const sent = list.filter((c) => c.status === "pending" && c.requested_by === user.id);

  function otherPerson(c: (typeof list)[number]) {
    const otherId = c.user_a === user!.id ? c.user_b : c.user_a;
    return profileMap[otherId];
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-ink mb-8">Messages</h1>

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="font-meta text-[11px] tracking-wider uppercase text-grey mb-3">
            Message requests
          </h2>
          <div className="divide-y divide-border border border-border rounded-sm">
            {pending.map((c) => {
              const person = otherPerson(c);
              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className="block p-4 hover:bg-offwhite transition-colors"
                >
                  <span className="font-body font-medium text-ink">
                    {person?.display_name ?? "Unknown"}
                  </span>
                  <span className="font-body text-sm text-grey ml-2">wants to message you</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="mb-10">
        <h2 className="font-meta text-[11px] tracking-wider uppercase text-grey mb-3">
          Conversations
        </h2>
        {accepted.length === 0 ? (
          <p className="font-body text-sm text-grey">No conversations yet.</p>
        ) : (
          <div className="divide-y divide-border border border-border rounded-sm">
            {accepted.map((c) => {
              const person = otherPerson(c);
              return (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className="block p-4 hover:bg-offwhite transition-colors font-body font-medium text-ink"
                >
                  {person?.display_name ?? "Unknown"}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {sent.length > 0 && (
        <section>
          <h2 className="font-meta text-[11px] tracking-wider uppercase text-grey mb-3">
            Sent requests, awaiting response
          </h2>
          <div className="divide-y divide-border border border-border rounded-sm">
            {sent.map((c) => {
              const person = otherPerson(c);
              return (
                <div key={c.id} className="p-4 font-body text-sm text-grey">
                  {person?.display_name ?? "Unknown"}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

