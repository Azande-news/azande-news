import Link from "next/link";
import Image from "next/image";
import { CATEGORY_LABELS } from "@/lib/categories";
import { stripHtml } from "@/lib/html";

type Post = {
  id: string;
  title: string;
  body: string;
  category: string;
  created_at: string;
  cover_image_url?: string | null;
  profiles: { display_name: string; username: string } | null;
};

type Variant = "lead" | "list" | "grid";

export default function PostCard({
  post,
  variant = "grid",
  featured = false,
}: {
  post: Post;
  variant?: Variant;
  featured?: boolean;
}) {
  const v: Variant = featured ? "lead" : variant;

  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category;

  const Meta = ({ className = "" }: { className?: string }) => (
    <div className={`font-meta text-[11px] tracking-wider uppercase text-accent ${className}`}>
      <Link href={`/category/${post.category}`} className="hover:underline">
        {categoryLabel}
      </Link>
      <span className="text-grey normal-case tracking-normal"> · {date}</span>
    </div>
  );

  const AuthorLink = ({ className = "" }: { className?: string }) => (
    <div className={`font-meta text-xs text-grey ${className}`}>
      By{" "}
      {post.profiles?.username ? (
        <Link href={`/author/${post.profiles.username}`} className="hover:text-accent hover:underline">
          {post.profiles.display_name}
        </Link>
      ) : (
        "Unknown"
      )}
    </div>
  );

  if (v === "lead") {
    const excerpt = stripHtml(post.body).slice(0, 220);
    return (
      <article>
        {post.cover_image_url && (
          <Link href={`/posts/${post.id}`}>
            <div className="relative w-full h-64 sm:h-[26rem] overflow-hidden mb-4 bg-offwhite">
              <Image
                src={post.cover_image_url}
                alt=""
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
            </div>
          </Link>
        )}
        <Meta className="mb-2" />
        <Link href={`/posts/${post.id}`} className="group">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-ink leading-[1.08] mb-3 group-hover:underline decoration-2 underline-offset-2">
            {post.title}
          </h1>
          <p className="font-body text-grey-dark text-base leading-relaxed">
            {excerpt}
            {post.body.length > excerpt.length ? "…" : ""}
          </p>
        </Link>
        <AuthorLink className="mt-3" />
      </article>
    );
  }

  if (v === "list") {
    return (
      <article className="flex gap-3 py-4 border-b border-border last:border-b-0">
        {post.cover_image_url && (
          <Link href={`/posts/${post.id}`} className="shrink-0">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 overflow-hidden bg-offwhite">
              <Image
                src={post.cover_image_url}
                alt=""
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          </Link>
        )}
        <div className="min-w-0">
          <Meta className="mb-1" />
          <Link href={`/posts/${post.id}`} className="group">
            <h3 className="font-display text-sm sm:text-base font-semibold text-ink leading-snug line-clamp-3 group-hover:underline">
              {post.title}
            </h3>
          </Link>
        </div>
      </article>
    );
  }

  // grid (default card)
  const excerpt = stripHtml(post.body).slice(0, 110);
  return (
    <article className="pb-2">
      {post.cover_image_url && (
        <Link href={`/posts/${post.id}`}>
          <div className="relative w-full h-40 overflow-hidden mb-3 bg-offwhite">
            <Image
              src={post.cover_image_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 360px"
            />
          </div>
        </Link>
      )}
      <Meta className="mb-1.5" />
      <Link href={`/posts/${post.id}`} className="group">
        <h3 className="font-display text-lg font-bold text-ink leading-snug mb-1.5 line-clamp-2 group-hover:underline">
          {post.title}
        </h3>
        <p className="font-body text-sm text-grey leading-relaxed line-clamp-2">
          {excerpt}
          {post.body.length > excerpt.length ? "…" : ""}
        </p>
      </Link>
      <AuthorLink className="mt-1.5" />
    </article>
  );
}

