import Link from "next/link";
import Image from "next/image";
import { CATEGORY_LABELS } from "@/lib/categories";

type Post = {
  id: string;
  title: string;
  body: string;
  category: string;
  created_at: string;
  cover_image_url?: string | null;
  profiles: { display_name: string; username: string } | null;
};

export default function PostCard({ post, featured = false }: { post: Post; featured?: boolean }) {
  const excerpt = post.body.replace(/\s+/g, " ").slice(0, featured ? 240 : 140);
  const date = new Date(post.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <article className={featured ? "py-2" : "py-6 border-t border-forest/10"}>
      {post.cover_image_url && (
        <Link href={`/posts/${post.id}`}>
          <div
            className={`relative w-full rounded-sm overflow-hidden mb-4 ${
              featured ? "h-72 sm:h-96" : "h-48"
            }`}
          >
            <Image
              src={post.cover_image_url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          </div>
        </Link>
      )}

      <div className="font-meta text-[11px] tracking-widest uppercase text-clay mb-2">
        <Link href={`/category/${post.category}`} className="hover:underline">
          {CATEGORY_LABELS[post.category] ?? post.category}
        </Link>
        {" · "}
        {date}
      </div>

      <Link href={`/posts/${post.id}`} className="group">
        <h2
          className={`font-display font-medium text-forest group-hover:text-clay transition-colors ${
            featured ? "text-4xl sm:text-5xl leading-[1.05] mb-4" : "text-2xl mb-2"
          }`}
        >
          {post.title}
        </h2>
        <p className="font-body text-ink/80 leading-relaxed">
          {excerpt}
          {post.body.length > excerpt.length ? "…" : ""}
        </p>
      </Link>

      <div className="font-meta text-xs text-forest/60 mt-3">
        By {post.profiles?.display_name ?? "Unknown"}
      </div>
    </article>
  );
}
