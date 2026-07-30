import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeletePostButton from "@/components/DeletePostButton";
import CommentSection from "@/components/CommentSection";
import ReportButton from "@/components/ReportButton";
import ShareButtons from "@/components/ShareButtons";
import BookmarkButton from "@/components/BookmarkButton";
import ViewTracker from "@/components/ViewTracker";
import TrendingWidget from "@/components/TrendingWidget";
import RelatedArticles from "@/components/RelatedArticles";
import { stripHtml, sanitizeHtml } from "@/lib/html";
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

  const description = stripHtml(post.body).slice(0, 160);

  return {
    title: `${post.title} — Azande News`,
    description,
    alternates: { canonical: `https://azande-news.vercel.app/posts/${params.id}` },
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
      "id, title, body, category, created_at, updated_at, author_id, cover_image_url, profiles(display_name, username)"
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

  const wasEdited = post.updated_at && new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 60000;
  const updatedDate = wasEdited
    ? new Date(post.updated_at).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null;

  const author = post.profiles as unknown as {
    display_name: string;
    username: string;
  } | null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    datePublished: post.created_at,
    dateModified: post.created_at,
    author: {
      "@type": "Person",
      name: author?.display_name ?? "Azande News",
    },
    publisher: {
      "@type": "Organization",
      name: "Azande News",
      logo: {
        "@type": "ImageObject",
        url: "https://azande-news.vercel.app/logo.png",
      },
    },
    description: stripHtml(post.body).slice(0, 160),
    image: post.cover_image_url ? [post.cover_image_url] : undefined,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://azande-news.vercel.app/posts/${post.id}`,
    },
  };

  return (
    <div className="max-w-6xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <article className="lg:col-span-2 min-w-0">
          <ViewTracker postId={post.id} />
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
            {wasEdited && <> &middot; Updated {updatedDate}</>}
          </div>

          {post.cover_image_url && (
            <div className="relative w-full h-72 sm:h-96 overflow-hidden mb-8 bg-offwhite">
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                className="object-cover"
                sizes="800px"
                priority
              />
            </div>
          )}

          <div className="prose-article font-body text-lg text-ink/90" dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.body) }} />

          <div className="mt-8 pt-6 border-t border-border flex items-center justify-between flex-wrap gap-3">
            <ReportButton postId={post.id} postTitle={post.title} />
            {canManage && <DeletePostButton postId={post.id} />}
          </div>

          <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
            <ShareButtons postId={post.id} postTitle={post.title} />
          </div>

          <div className="mt-4">
            <BookmarkButton postId={post.id} />
          </div>

          <CommentSection postId={post.id} isAdmin={canManage} />
        </article>

        <aside className="lg:border-l lg:border-border lg:pl-8">
          <TrendingWidget />

          <div className="mt-10 pt-6 border-t border-border">
            <h2 className="font-meta text-[11px] tracking-wider uppercase text-grey mb-3">
              Explore
            </h2>
            <div className="space-y-2 font-body text-sm">
              <Link href="/azande-people" className="block text-ink hover:text-accent">
                Azande Heritage &rarr;
              </Link>
              <Link href="/dictionary" className="block text-ink hover:text-accent">
                Zande Dictionary &rarr;
              </Link>
              <Link href="/posts/new" className="block text-ink hover:text-accent">
                Write a Post &rarr;
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <RelatedArticles category={post.category} excludeId={post.id} />
    </div>
  );
}


