"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-md mx-auto text-center py-20">
      <h1 className="font-display text-trafalgar sm:text-trafalgar-lg font-medium text-ink mb-4">
        Something went wrong
      </h1>
      <p className="font-body text-body-copy text-grey mb-8">
        An unexpected error occurred. You can try again, or head back to the homepage.
      </p>
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={reset}
          className="bg-ink text-paper px-5 py-2.5 hover:bg-black transition-colors font-meta text-brevier font-semibold"
        >
          Try again
        </button>
        <a href="/" className="border border-border px-5 py-2.5 hover:bg-offwhite transition-colors font-meta text-brevier font-semibold text-ink">
          Go home
        </a>
      </div>
    </div>
  );
}
