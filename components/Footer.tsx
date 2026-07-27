import Link from "next/link";
import NewsletterSignup from "@/components/NewsletterSignup";

const SOCIAL_LINKS = [
  {
    name: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61592561219062",
    path: "M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z",
  },
  {
    name: "X",
    href: "https://x.com/AzandeNews",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
  {
    name: "Instagram",
    href: "https://www.instagram.com/azandenews/",
    path: "M12 2c-2.716 0-3.056.012-4.123.06-1.064.05-1.791.218-2.427.465a4.902 4.902 0 0 0-1.771 1.153A4.902 4.902 0 0 0 2.526 5.45c-.247.636-.416 1.363-.465 2.427C2.012 8.944 2 9.284 2 12s.012 3.056.06 4.123c.05 1.064.218 1.791.465 2.427a4.902 4.902 0 0 0 1.153 1.771 4.902 4.902 0 0 0 1.771 1.153c.636.247 1.363.416 2.427.465C8.944 21.988 9.284 22 12 22s3.056-.012 4.123-.06c1.064-.05 1.791-.218 2.427-.465a4.902 4.902 0 0 0 1.771-1.153 4.902 4.902 0 0 0 1.153-1.771c.247-.636.416-1.363.465-2.427.048-1.067.06-1.407.06-4.123s-.012-3.056-.06-4.123c-.05-1.064-.218-1.791-.465-2.427a4.902 4.902 0 0 0-1.153-1.771A4.902 4.902 0 0 0 18.55 2.525c-.636-.247-1.363-.416-2.427-.465C15.056 2.012 14.716 2 12 2zm0 1.802c2.67 0 2.986.01 4.04.059.976.045 1.505.207 1.858.344.467.182.8.399 1.15.748.35.35.566.683.748 1.15.137.353.3.882.344 1.857.048 1.055.058 1.37.058 4.04s-.01 2.986-.058 4.04c-.045.976-.207 1.505-.344 1.858a3.1 3.1 0 0 1-.748 1.15 3.1 3.1 0 0 1-1.15.748c-.353.137-.882.3-1.857.344-1.054.048-1.37.058-4.041.058s-2.987-.01-4.04-.058c-.976-.045-1.505-.207-1.858-.344a3.1 3.1 0 0 1-1.15-.748 3.1 3.1 0 0 1-.748-1.15c-.137-.353-.3-.882-.344-1.857-.048-1.055-.058-1.37-.058-4.041s.01-2.986.058-4.04c.045-.976.207-1.505.344-1.858.182-.467.399-.8.748-1.15a3.1 3.1 0 0 1 1.15-.748c.353-.137.882-.3 1.857-.344 1.055-.048 1.37-.058 4.041-.058zm0 4.594a5.604 5.604 0 1 0 0 11.208 5.604 5.604 0 0 0 0-11.208zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm5.849-9.849a1.31 1.31 0 1 1-2.62 0 1.31 1.31 0 0 1 2.62 0z",
  },
  {
    name: "Threads",
    href: "https://www.threads.com/@azandenews",
    path: "M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.075-3.87-3.732-5.837-7.897-5.848-2.994.021-5.257.98-6.727 2.848C4.404 6.685 3.72 9.061 3.694 12c.026 2.939.71 5.315 2.171 7.166 1.47 1.868 3.733 2.827 6.727 2.848 2.696-.02 4.478-.657 5.95-2.129 1.677-1.677 1.645-3.75 1.116-5.024-.313-.757-.878-1.383-1.652-1.858-.192 1.397-.62 2.512-1.288 3.352-.905 1.143-2.187 1.767-3.813 1.86-1.229.07-2.412-.216-3.331-.808-1.087-.7-1.723-1.766-1.79-3.003-.13-2.446 1.815-4.207 4.84-4.383a11.9 11.9 0 0 1 3.03.185c-.124-.751-.377-1.35-.756-1.784-.522-.598-1.328-.904-2.397-.911h-.028c-.86 0-2.026.238-2.766 1.363l-1.756-1.203c.994-1.51 2.612-2.34 4.554-2.34h.037c3.235.02 5.16 1.995 5.352 5.436.11.047.219.096.325.148 1.51.732 2.612 1.844 3.188 3.216.804 1.91.878 5.021-1.643 7.542-1.887 1.886-4.173 2.735-7.409 2.756z",
  },
];

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
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map((social) => (
                <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={`Azande News on ${social.name}`} className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
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
