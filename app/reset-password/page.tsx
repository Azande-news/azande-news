"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Supabase's password-recovery link signs the user in via a URL fragment.
    // Listening for PASSWORD_RECOVERY confirms we're in a valid recovery session
    // before showing the form, instead of trusting the URL blindly.
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <h1 className="font-display text-3xl text-forest mb-4">
          Password updated
        </h1>
        <p className="font-body text-ink/80">
          Redirecting you to log in…
        </p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="max-w-md mx-auto text-center py-12">
        <p className="font-body text-ink/70">
          Verifying your reset link…
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl text-forest mb-8">
        Set a new password
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-body text-sm text-forest mb-1">
            New password
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-forest/30 rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-ochre"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-forest mb-1">
            Confirm new password
          </label>
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-forest/30 rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-ochre"
          />
        </div>

        {error && <p className="text-clay font-body text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-forest text-ivory py-3 rounded-sm hover:bg-forest-light transition-colors font-body disabled:opacity-60"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
