import Link from "next/link";
import NewsletterSignup from "@/components/NewsletterSignup";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#1A1A1A] text-white/70 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-8 mb-8 pb-8 border-b border-white/15">
          <div>
            <div className="font-display text-lg font-bold text-white mb-2">
              Azande News
            </div>
            <p className="text-sm text-white/50 max-w-xs mb-3">
              By and for the Azande people, worldwide.
            </p>
            <a href="https://www.facebook.com/profile.php?id=61592561219062" target="_blank" rel="noopener noreferrer" aria-label="Azande News on Facebook" className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
            </a>
          </div>

          <div className="max-w-sm">
            <div className="font-display text-sm font-bold text-white mb-2">
              Get the latest by email
            </div>
            <p className="text-sm text-white/50 mb-3">
              Join our list to hear when new stories are published.
            </p>
            <NewsletterSignup />
          </div>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm mb-8">
          <Link href="/about" className="hover:text-white transition-colors">About Us</Link>
          <Link href="/contact" className="hover:text-white transition-colors">Contact Us</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Use</Link>
          <Link href="/editorial-standards" className="hover:text-white transition-colors">Editorial Guidelines</Link>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs font-meta text-white/50">
          <span>&copy; {year} Azande News. By and for the Azande people, worldwide.</span>
          <span>DR Congo &middot; South Sudan &middot; Central African Republic &middot; Diaspora</span>
        </div>
      </div>
    </footer>
  );
}
