"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/reset-password`,
      }
    );

    setLoading(false);

    if (resetError) {
      setError(resetError.message);
      return;
    }

    setSent(true);
  }

  if (sent) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h1 className="font-display text-3xl text-forest mb-4">
          Check your email
        </h1>
        <p className="font-body text-ink/80">
          If an account exists for <strong>{email}</strong>, we sent a link
          to reset your password. It expires after a short while, so use it
          soon.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl text-forest mb-2">
        Reset your password
      </h1>
      <p className="font-body text-ink/70 mb-8">
        Enter the email you registered with and we&apos;ll send you a link
        to set a new password.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-body text-sm text-forest mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-forest/30 rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-ochre"
          />
        </div>

        {error && <p className="text-clay font-body text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest text-ivory py-3 rounded-sm hover:bg-forest-light transition-colors font-body disabled:opacity-60"
        >
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="font-body text-sm text-ink/70 mt-6">
        <Link href="/login" className="text-clay hover:underline">
          Back to log in
        </Link>
      </p>
    </div>
  );
}
