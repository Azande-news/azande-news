"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SearchBox() {
  const router = useRouter();
  const [q, setQ] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length === 0) return;
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-xs w-full">
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search articles"
        className="flex-1 min-w-0 border border-border rounded-sm px-3 py-1.5 text-sm text-ink bg-paper placeholder-grey focus:outline-none focus:border-accent"
      />
      <button
        type="submit"
        className="bg-accent text-white px-4 py-1.5 rounded-sm text-sm font-medium hover:bg-accent-light transition-colors shrink-0"
      >
        Search
      </button>
    </form>
  );
}
