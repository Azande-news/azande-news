import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <h1 className="font-display text-canon sm:text-canon-lg text-ink mb-4">
        Page not found
      </h1>
      <p className="font-body text-ink/70 mb-6">
        That post or page doesn't exist, or may have been removed.
      </p>
      <Link href="/" className="text-accent hover:underline font-body">
        Back to the front page
      </Link>
    </div>
  );
}
