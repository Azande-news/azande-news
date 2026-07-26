import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConversationView from "@/components/ConversationView";

export default async function ConversationPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/messages/${params.id}`);

  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, user_a, user_b, requested_by, status")
    .eq("id", params.id)
    .single();

  if (!conversation) notFound();
  if (conversation.user_a !== user.id && conversation.user_b !== user.id) notFound();

  const otherId = conversation.user_a === user.id ? conversation.user_b : conversation.user_a;
  const { data: otherProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", otherId)
    .single();

  return (
    <ConversationView
      conversation={conversation}
      currentUserId={user.id}
      otherPersonName={otherProfile?.display_name ?? "Unknown"}
    />
  );
}
