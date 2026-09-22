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
import SmartTime from "@/components/SmartTime";
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
    title: `${post.title} - Azande News`,
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
      "id, title, body, category, created_at, updated_at, author_id, cover_image_url, image_caption, image_credit, profiles(display_name, username)"
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

  const wordCount = stripHtml(post.body).split(/\s+/).filter(Boolean).length;
  const readingMinutes = Math.max(1, Math.round(wordCount / 200));

  const wasEdited =
    post.updated_at &&
    new Date(post.updated_at).getTime() - new Date(post.created_at).getTime() > 60000;
  const updatedDate = wasEdited ? post.updated_at : null;

  const author = post.profiles as unknown as {
    display_name: string;
    username: string;
  } | null;

  const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.title,
    datePublished: post.created_at,
    dateModified: post.updated_at ?? post.created_at,
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
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-10">
        <article className="lg:col-span-8 min-w-0">
          <ViewTracker postId={post.id} />

          <div className="max-w-read">
            <h1 className="font-display text-canon sm:text-canon-lg font-medium text-ink mb-4">
              {post.title}
            </h1>

            <div className="font-meta text-brevier text-grey pb-4 mb-6 border-b border-rule">
              <div className="font-semibold text-ink">
                By {author?.display_name ?? "Azande News"}
              </div>
              <div className="mt-0.5">
                <SmartTime iso={post.created_at} />
                <span className="mx-1.5 text-border">|</span>
                {readingMinutes} min read
                {wasEdited && (
                  <>
                    <span className="mx-1.5 text-border">|</span>
                    Updated <SmartTime iso={updatedDate} />
                  </>
                )}
              </div>
              <div className="mt-3">
                <ShareButtons postId={post.id} postTitle={post.title} />
              </div>
            </div>
          </div>

          {post.cover_image_url && (
            <figure className="mb-8">
              <div className="relative w-full aspect-[16/9] overflow-hidden bg-offwhite">
                <Image
                  src={post.cover_image_url}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 720px"
                  priority
                />
              </div>
              {(post.image_caption || post.image_credit) && (
                <figcaption className="mt-2 font-meta text-brevier text-grey">
                  {post.image_caption && <span className="italic">{post.image_caption}</span>}
                  {post.image_credit && (
                    <span className="block mt-0.5 text-minion">Image source, {post.image_credit}</span>
                  )}
                </figcaption>
              )}
            </figure>
          )}

          <div
            className="prose-article max-w-read font-serif text-read sm:text-read-lg text-ink"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.body) }}
          />

          <div className="max-w-read mt-10 pt-6 block-rule">
            <h2 className="section-label mb-3">Related topics</h2>
            <Link
              href={`/category/${post.category}`}
              className="inline-block font-meta text-brevier font-semibold bg-offwhite hover:bg-border text-ink px-3 py-2 transition-colors"
            >
              {categoryLabel}
            </Link>
          </div>

          <div className="max-w-read mt-8 pt-6 block-rule flex items-center gap-5 flex-wrap">
            <BookmarkButton postId={post.id} />
            <ReportButton postId={post.id} postTitle={post.title} />
            {canManage && (
              <>
                <Link
                  href={`/posts/${post.id}/edit`}
                  className="font-meta text-brevier font-semibold text-ink hover:underline"
                >
                  Edit this post
                </Link>
                <DeletePostButton postId={post.id} />
              </>
            )}
          </div>

          <div className="max-w-read">
            <CommentSection postId={post.id} isAdmin={canManage} />
          </div>
        </article>

        <aside className="lg:col-span-4 lg:border-l lg:border-rule lg:pl-8">
          <TrendingWidget />

          <div className="mt-10 pt-6 block-rule">
            <h2 className="section-label mb-3">Explore</h2>
            <div className="font-meta text-brevier-lg">
              <Link
                href="/azande-people"
                className="block py-2.5 border-b border-rule text-ink hover:underline"
              >
                Azande Heritage
              </Link>
              <Link
                href="/dictionary"
                className="block py-2.5 border-b border-rule text-ink hover:underline"
              >
                Zande Dictionary
              </Link>
              <Link
                href="/posts/new"
                className="block py-2.5 text-ink hover:underline"
              >
                Write a Post
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <RelatedArticles category={post.category} excludeId={post.id} />
    </div>
  );
}






