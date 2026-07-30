"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AccountSettingsPage() {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState<"initial" | "confirm">("initial");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (confirmText.trim().toUpperCase() !== "DELETE") {
      setError('Please type DELETE in capital letters to confirm.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/delete-account", { method: "POST" });
      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Account settings</h1>
      <p className="font-body text-grey mb-8">
        Manage your Azande News account.
      </p>

      <div className="border border-accent/30 rounded-sm p-5">
        <h2 className="font-display text-lg font-bold text-ink mb-2">Delete my account</h2>
        <p className="font-body text-sm text-grey mb-4">
          This permanently deletes your login and personal information. Your email and password will
          stop working immediately, and this cannot be undone. Any posts or comments you have made will
          remain visible to the community but will show as posted by &ldquo;Deleted User&rdquo; rather
          than your name.
        </p>

        {step === "initial" && (
          <button
            onClick={() => setStep("confirm")}
            className="text-sm font-medium text-accent hover:underline"
          >
            Delete my account
          </button>
        )}

        {step === "confirm" && (
          <div className="space-y-4">
            <div>
              <label className="block font-body text-sm text-ink mb-1">
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full border border-border rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink"
              />
            </div>
            {error && <p className="text-accent font-body text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleDelete}
                disabled={loading}
                className="bg-accent text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-60"
              >
                {loading ? "Deleting…" : "Permanently delete my account"}
              </button>
              <button
                onClick={() => { setStep("initial"); setConfirmText(""); setError(null); }}
                className="px-5 py-2.5 rounded-sm border border-border text-sm font-medium hover:bg-offwhite transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
