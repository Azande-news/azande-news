"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim().toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
      setError(
        "Username must be 3-20 characters: lowercase letters, numbers, underscores only."
      );
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: cleanUsername,
          display_name: displayName.trim() || cleanUsername,
        },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h1 className="font-display text-3xl text-forest mb-4">
          Check your email
        </h1>
        <p className="font-body text-ink/80">
          We sent a confirmation link to <strong>{email}</strong>. Click it
          to activate your account, then come back and log in.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl text-forest mb-2">
        Join Azande News
      </h1>
      <p className="font-body text-ink/70 mb-8">
        Free, worldwide, and open to anyone in the Azande community and its
        friends.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-body text-sm text-forest mb-1">
            Display name
          </label>
          <input
            type="text"
            required
            maxLength={60}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full border border-forest/30 rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-ochre"
            placeholder="e.g. Nzoya Gbudue"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-forest mb-1">
            Username
          </label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-forest/30 rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-ochre"
            placeholder="lowercase, no spaces"
          />
        </div>

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
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-forest/30 rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-ochre"
            placeholder="At least 8 characters"
          />
        </div>

        {error && <p className="text-clay font-body text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest text-ivory py-3 rounded-sm hover:bg-forest-light transition-colors font-body disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create free account"}
        </button>
      </form>

      <p className="font-body text-sm text-ink/70 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-clay hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
