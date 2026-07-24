"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Entry = {
  id: string;
  zande_word: string;
  english_translation: string;
  notes: string | null;
  status: string;
  profiles: { display_name: string; username: string } | null;
};

export default function AdminDictionaryTable({ entries }: { entries: Entry[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function approve(id: string) {
    setBusyId(id);
    await supabase.from("dictionary_entries").update({ status: "approved" }).eq("id", id);
    setBusyId(null);
    router.refresh();
  }

  async function reject(id: string) {
    setBusyId(id);
    await supabase.from("dictionary_entries").update({ status: "rejected" }).eq("id", id);
    setBusyId(null);
    router.refresh();
  }

  async function remove(id: string) {
    setBusyId(id);
    await supabase.from("dictionary_entries").delete().eq("id", id);
    setBusyId(null);
    router.refresh();
  }

  if (entries.length === 0) {
    return <p className="font-body text-grey text-sm">No pending dictionary submissions.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {entries.map((e) => (
        <div key={e.id} className="py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-body font-medium text-ink">
              {e.zande_word} &mdash; {e.english_translation}
            </div>
            {e.notes && <div className="font-body text-sm text-grey mt-0.5">{e.notes}</div>}
            <div className="font-meta text-xs text-grey mt-1">
              submitted by {e.profiles?.display_name ?? "Unknown"} &middot; {e.status}
            </div>
          </div>
          <div className="flex gap-3 font-body text-sm">
            {e.status !== "approved" && (
              <button onClick={() => approve(e.id)} disabled={busyId === e.id} className="text-ink hover:underline disabled:opacity-50">
                Approve
              </button>
            )}
            {e.status !== "rejected" && (
              <button onClick={() => reject(e.id)} disabled={busyId === e.id} className="text-grey hover:underline disabled:opacity-50">
                Reject
              </button>
            )}
            <button onClick={() => remove(e.id)} disabled={busyId === e.id} className="text-accent hover:underline disabled:opacity-50">
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
