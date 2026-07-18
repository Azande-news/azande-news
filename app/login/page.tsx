"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError("Incorrect email or password.");
      return;
    }

    const next = searchParams.get("next") || "/";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl text-forest mb-8">Log in</h1>

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

        <div>
          <label className="block font-body text-sm text-forest mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-forest/30 rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-ochre"
          />
        </div>

        {error && <p className="text-clay font-body text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest text-ivory py-3 rounded-sm hover:bg-forest-light transition-colors font-body disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="font-body text-sm text-ink/70 mt-6">
        New here?{" "}
        <Link href="/register" className="text-clay hover:underline">
          Create a free account
        </Link>
      </p>
    </div>
  );
}
