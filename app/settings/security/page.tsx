"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; friendly_name?: string | null; factor_type: string; status: string };

export default function SecuritySettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function loadFactors() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?next=/settings/security");
      return;
    }
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp ?? []) as Factor[]);
    setLoading(false);
  }

  useEffect(() => {
    loadFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEnroll() {
    setError(null);
    setEnrolling(true);
    const { data, error: enrollError } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (enrollError || !data) {
      setError(enrollError?.message ?? "Could not start setup. Please try again.");
      setEnrolling(false);
      return;
    }
    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setPendingFactorId(data.id);
  }

  async function confirmEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingFactorId) return;
    setError(null);

    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: pendingFactorId });
    if (challengeError || !challenge) {
      setError("Something went wrong. Please try again.");
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: pendingFactorId,
      challengeId: challenge.id,
      code: verifyCode.trim(),
    });

    if (verifyError) {
      setError("Incorrect code. Please check your authenticator app and try again.");
      return;
    }

    setDone(true);
    setEnrolling(false);
    setQrCode(null);
    setPendingFactorId(null);
    loadFactors();
  }

  async function removeFactor(id: string) {
    const confirmed = window.confirm("Remove this authenticator? You will no longer be asked for a code at login.");
    if (!confirmed) return;
    await supabase.auth.mfa.unenroll({ factorId: id });
    loadFactors();
  }

  if (loading) return null;

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Two-factor authentication</h1>
      <p className="font-body text-grey mb-8">
        Add an extra layer of security to your account with an authenticator app like Google Authenticator or Authy.
      </p>

      {factors.filter((f) => f.status === "verified").length > 0 && (
        <div className="mb-8 border border-border rounded-sm divide-y divide-border">
          {factors.filter((f) => f.status === "verified").map((f) => (
            <div key={f.id} className="p-4 flex items-center justify-between">
              <span className="font-body text-sm text-ink">Authenticator app enabled</span>
              <button onClick={() => removeFactor(f.id)} className="text-sm text-accent hover:underline">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {done && (
        <p className="font-body text-sm text-ink bg-offwhite border border-border rounded-sm p-4 mb-6">
          Two-factor authentication is now enabled. You will be asked for a code the next time you log in.
        </p>
      )}

      {!enrolling && factors.filter((f) => f.status === "verified").length === 0 && (
        <button
          onClick={startEnroll}
          className="bg-accent text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:bg-accent-light transition-colors"
        >
          Set up two-factor authentication
        </button>
      )}

      {enrolling && qrCode && (
        <div className="border border-border rounded-sm p-5">
          <p className="font-body text-sm text-ink mb-4">
            Scan this QR code with your authenticator app, then enter the 6-digit code it shows.
          </p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrCode} alt="Scan this QR code with your authenticator app" className="mx-auto mb-4 border border-border" />
          {secret && (
            <p className="font-meta text-xs text-grey text-center mb-4 break-all">
              Or enter this key manually: {secret}
            </p>
          )}
          <form onSubmit={confirmEnroll} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              className="w-full border border-border rounded-sm px-3 py-2 font-body text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink"
              placeholder="000000"
            />
            {error && <p className="text-accent font-body text-sm">{error}</p>}
            <button
              type="submit"
              disabled={verifyCode.length !== 6}
              className="w-full bg-ink text-paper py-3 rounded-sm hover:bg-accent transition-colors font-body font-medium disabled:opacity-60"
            >
              Confirm and enable
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
