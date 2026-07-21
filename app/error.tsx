"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <h1 className="font-display text-3xl text-forest mb-4">
        Something went wrong
      </h1>
      <p className="font-body text-ink/70 mb-8">
        We hit an unexpected error loading this page. You can try again, or
        head back to the front page.
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="bg-forest text-ivory px-5 py-2.5 rounded-sm hover:bg-forest-light transition-colors font-body"
        >
          Try again
        </button>
        <a
          href="/"
          className="border border-forest/30 px-5 py-2.5 rounded-sm hover:bg-forest/5 transition-colors font-body"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
