"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NewsletterSignup() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: email.trim().toLowerCase() });

    setLoading(false);

    if (insertError) {
      if (insertError.code === "23505") {
        setError("That email is already subscribed.");
      } else {
        setError("Something went wrong. Please try again.");
      }
      return;
    }

    setDone(true);
  }

  if (done) {
    return (
      <p className="font-body text-sm text-white/70">
        Thanks — you&apos;re on the list.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-sm">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email"
        className="flex-1 bg-white/10 border border-white/25 rounded-sm px-3 py-2 text-sm text-white placeholder-white/50 focus:outline-none focus:border-accent"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-accent text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-60 shrink-0"
      >
        {loading ? "Joining…" : "Subscribe"}
      </button>
      {error && <p className="text-accent-light text-xs sm:hidden">{error}</p>}
    </form>
  );
}
