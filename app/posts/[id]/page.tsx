import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeletePostButton from "@/components/DeletePostButton";
import CommentSection from "@/components/CommentSection";
import ReportButton from "@/components/ReportButton";
import { CATEGORY_LABELS } from "@/lib/categories";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const { data: post } = await supabase
    .from("posts")
    .select("title, body, cover_image_url")
    .eq("id", params.id)
    .single();

  if (!post) return {};

  const description = post.body.replace(/\s+/g, " ").slice(0, 160);

  return {
    title: `${post.title} — Azande News`,
    description,
    openGraph: {
      title: post.title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
  };
}

export default async function PostPage({ params }: { params: { id: string } }) {
  const supabase = createClient();

  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, title, body, category, created_at, author_id, cover_image_url, profiles(display_name, username)"
    )
    .eq("id", params.id)
    .single();

  if (!post) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let canManage = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    canManage = user.id === post.author_id || profile?.role === "admin";
  }

  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const author = post.profiles as unknown as {
    display_name: string;
    username: string;
  } | null;

  return (
    <article className="max-w-2xl mx-auto">
      <div className="font-meta text-[11px] tracking-widest uppercase text-accent mb-3">
        <Link href={`/category/${post.category}`} className="hover:underline">
          {CATEGORY_LABELS[post.category] ?? post.category}
        </Link>
      </div>
      <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-[1.1] mb-4">
        {post.title}
      </h1>
      <div className="font-meta text-sm text-grey mb-8">
        By {author?.display_name ?? "Unknown"} &middot; {date}
      </div>

      {post.cover_image_url && (
        <div className="relative w-full h-72 sm:h-96 overflow-hidden mb-8 bg-offwhite">
          <Image
            src={post.cover_image_url}
            alt=""
            fill
            className="object-cover"
            sizes="800px"
            priority
          />
        </div>
      )}

      <div className="prose-article font-body text-lg text-ink/90 whitespace-pre-wrap">
        {post.body}
      </div>

      <div className="mt-8 pt-6 border-t border-border flex items-center justify-between flex-wrap gap-3">
        <ReportButton postId={post.id} />
        {canManage && <DeletePostButton postId={post.id} />}
      </div>

      <CommentSection postId={post.id} />
    </article>
  );
}
