import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink text-white/70 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="font-display text-lg font-bold text-white mb-4">
          Azande News
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-8">
          {CATEGORIES.map((c) => (
            <Link
              key={c.value}
              href={`/category/${c.value}`}
              className="hover:text-white transition-colors"
            >
              {c.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/15 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-meta text-white/50">
          <span>
            &copy; {year} Azande News. By and for the Azande people, worldwide.
          </span>
          <span>Western Equatoria &middot; South Sudan &middot; Diaspora</span>
        </div>
      </div>
    </footer>
  );
}
