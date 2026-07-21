import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";

export const revalidate = 0;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const supabase = createClient();

  let results: Array<Parameters<typeof PostCard>[0]["post"]> = [];

  if (q.length > 0) {
    const { data } = await supabase
      .from("posts")
      .select(
        "id, title, body, category, created_at, cover_image_url, profiles(display_name, username)"
      )
      .eq("status", "published")
      .or(`title.ilike.%${q}%,body.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .limit(30);

    results = (data ?? []) as unknown as typeof results;
  }

  return (
    <div>
      <form action="/search" className="mb-8">
        <div className="flex gap-2 max-w-xl">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search Azande News..."
            autoFocus
            className="flex-1 border border-border rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="bg-ink text-paper px-5 py-2.5 rounded-sm text-sm font-medium hover:bg-accent transition-colors"
          >
            Search
          </button>
        </div>
      </form>

      {q.length === 0 && (
        <p className="font-body text-grey">
          Type a keyword above to search articles by title or content.
        </p>
      )}

      {q.length > 0 && (
        <>
          <p className="font-meta text-xs uppercase tracking-wider text-grey mb-6">
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
          </p>

          {results.length === 0 ? (
            <p className="font-body text-grey">
              No articles matched your search. Try a different keyword.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
              {results.map((post) => (
                <PostCard key={post.id} post={post} variant="grid" />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
