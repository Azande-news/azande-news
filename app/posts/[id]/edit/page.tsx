import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditPostForm from "@/components/EditPostForm";

export default async function EditPostPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("id, title, body, category, cover_image_url, author_id, status, publish_at")
    .eq("id", params.id)
    .single();

  if (!post) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?next=/posts/${params.id}/edit`);

  let isAdmin = false;
  if (user.id !== post.author_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  if (user.id !== post.author_id && !isAdmin) {
    redirect(`/posts/${params.id}`);
  }

  return <EditPostForm post={post} />;
}

