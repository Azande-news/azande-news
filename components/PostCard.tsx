import Link from "next/link";
import Image from "next/image";
import { CATEGORY_LABELS } from "@/lib/categories";
import { stripHtml } from "@/lib/html";
import SmartTime from "@/components/SmartTime";

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
  const categoryLabel = CATEGORY_LABELS[post.category] ?? post.category;

  const Meta = ({ className = "" }: { className?: string }) => (
    <div className={`font-meta text-minion text-grey ${className}`}>
      <span><SmartTime iso={post.created_at} /></span>
      <span className="mx-1.5 text-border">|</span>
      <Link href={`/category/${post.category}`} className="hover:underline">
        {categoryLabel}
      </Link>
    </div>
  );

  const AuthorLink = ({ className = "" }: { className?: string }) => (
    <div className={`font-meta text-minion text-grey ${className}`}>
      {post.profiles?.username ? (
        <Link href={`/author/${post.profiles.username}`} className="hover:underline">
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
            <div className="relative w-full aspect-[16/9] overflow-hidden mb-4 bg-offwhite">
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
        <Link href={`/posts/${post.id}`} className="group">
          <h2 className="font-display text-canon sm:text-canon-lg font-medium text-ink mb-2 group-hover:underline underline-offset-2">
            {post.title}
          </h2>
          <p className="font-body text-body-copy text-grey">
            {excerpt}
            {post.body.length > excerpt.length ? "…" : ""}
          </p>
        </Link>
        <Meta className="mt-3" />
      </article>
    );
  }

  if (v === "list") {
    return (
      <article className="flex gap-3 py-4 border-b border-rule last:border-b-0">
        <div className="min-w-0 flex-1">
          <Link href={`/posts/${post.id}`} className="group">
            <h3 className="font-display text-double-pica font-medium text-ink line-clamp-3 group-hover:underline">
              {post.title}
            </h3>
          </Link>
          <Meta className="mt-2" />
        </div>
        {post.cover_image_url && (
          <Link href={`/posts/${post.id}`} className="shrink-0">
            <div className="relative w-24 aspect-[16/9] overflow-hidden bg-offwhite">
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
      </article>
    );
  }

  const excerpt = stripHtml(post.body).slice(0, 110);
  return (
    <article className="pb-2">
      {post.cover_image_url && (
        <Link href={`/posts/${post.id}`}>
          <div className="relative w-full aspect-[16/9] overflow-hidden mb-3 bg-offwhite">
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
      <Link href={`/posts/${post.id}`} className="group">
        <h3 className="font-display text-paragon font-medium text-ink mb-1.5 line-clamp-3 group-hover:underline">
          {post.title}
        </h3>
        <p className="font-body text-brevier text-grey line-clamp-2">
          {excerpt}
          {post.body.length > excerpt.length ? "…" : ""}
        </p>
      </Link>
      <Meta className="mt-2" />
      <AuthorLink className="mt-1" />
    </article>
  );
}


