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

  const [needsMfa, setNeedsMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [factorId, setFactorId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError("Incorrect email or password.");
      return;
    }

    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setLoading(false);

    if (aal?.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totpFactor = factors?.totp?.[0];
      if (totpFactor) {
        setFactorId(totpFactor.id);
        setNeedsMfa(true);
        return;
      }
    }

    const next = searchParams.get("next") || "/";
    router.push(next);
    router.refresh();
  }

  async function handleVerifyMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setLoading(true);

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError || !challenge) {
      setLoading(false);
      setError("Something went wrong. Please try again.");
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.id,
      code: mfaCode.trim(),
    });

    setLoading(false);

    if (verifyError) {
      setError("Incorrect code. Please try again.");
      return;
    }

    const next = searchParams.get("next") || "/";
    router.push(next);
    router.refresh();
  }

  if (needsMfa) {
    return (
      <div className="max-w-md mx-auto">
        <h1 className="font-display text-3xl font-bold text-ink mb-2">Enter your code</h1>
        <p className="font-body text-grey mb-8">
          Open your authenticator app and enter the 6-digit code for Azande News.
        </p>
        <form onSubmit={handleVerifyMfa} className="space-y-5">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            required
            value={mfaCode}
            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
            className="w-full border border-border rounded-sm px-3 py-2 font-body text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-accent"
            placeholder="000000"
          />
          {error && <p className="text-accent font-body text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || mfaCode.length !== 6}
            className="w-full bg-ink text-paper py-3 rounded-sm hover:bg-accent transition-colors font-body font-medium disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl font-bold text-ink mb-8">Log in</h1>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-body text-sm text-ink mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-border rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-body text-sm text-ink">
              Password
            </label>
            <Link href="/forgot-password" className="font-body text-xs text-accent hover:underline">
              Forgot password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-border rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        {error && <p className="text-accent font-body text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-ink text-paper py-3 rounded-sm hover:bg-accent transition-colors font-body font-medium disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="font-body text-sm text-grey mt-6">
        New here?{" "}
        <Link href="/register" className="text-accent hover:underline">
          Create a free account
        </Link>
      </p>
    </div>
  );
}
