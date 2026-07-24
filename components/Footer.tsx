import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1A1A1A] text-white/70 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8 pb-8 border-b border-white/15">
          <div>
            <div className="font-display text-lg font-bold text-white mb-4">
              Azande News
            </div>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-4">
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
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/50">
              <Link href="/azande-people" className="hover:text-white transition-colors">
                The Azande People
              </Link>
              <Link href="/about" className="hover:text-white transition-colors">
                About
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contact
              </Link>
              <Link href="/search" className="hover:text-white transition-colors">
                Search
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms
              </Link>
              <Link href="/editorial-standards" className="hover:text-white transition-colors">
                Editorial Standards
              </Link>
            </nav>
          </div>

          <div>
            <div className="font-display text-sm font-bold text-white mb-2">
              Get the latest by email
            </div>
            <p className="text-sm text-white/50 mb-3">
              Join our list to hear when new stories are published.
            </p>
            <NewsletterSignup />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-meta text-white/50">
          <span>
            &copy; {year} Azande News. By and for the Azande people, worldwide.
          </span>
          <span>DR Congo &middot; South Sudan &middot; Central African Republic &middot; Diaspora</span>
        </div>
      </div>
    </footer>
  );
}




