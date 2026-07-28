"use client";

import { useState } from "react";

type Subscriber = {
  id: string;
  email: string;
  created_at: string;
};

export default function AdminSubscribersTable({ subscribers }: { subscribers: Subscriber[] }) {
  const [copied, setCopied] = useState(false);

  async function copyAllEmails() {
    const emails = subscribers.map((s) => s.email).join(", ");
    try {
      await navigator.clipboard.writeText(emails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable, ignore
    }
  }

  if (subscribers.length === 0) {
    return <p className="font-body text-grey text-sm">No subscribers yet.</p>;
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
        <p className="font-body text-sm text-grey">
          Since automated bulk newsletter sending isn&apos;t set up yet (requires a verified custom domain),
          you can copy the list below to email subscribers manually in the meantime.
        </p>
        <button
          onClick={copyAllEmails}
          className="text-sm font-medium text-accent hover:underline shrink-0"
        >
          {copied ? "Copied!" : "Copy all emails"}
        </button>
      </div>
      <div className="divide-y divide-border border border-border rounded-sm max-h-80 overflow-y-auto">
        {subscribers.map((s) => (
          <div key={s.id} className="py-2 px-3 flex items-center justify-between gap-3 font-body text-sm">
            <span className="text-ink">{s.email}</span>
            <span className="text-grey text-xs shrink-0">
              {new Date(s.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
