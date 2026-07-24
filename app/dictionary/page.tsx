"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { censorText } from "@/lib/profanity";

type Entry = {
  id: string;
  zande_word: string;
  english_translation: string;
  notes: string | null;
};

export default function DictionaryPage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [q, setQ] = useState("");

  const [zandeWord, setZandeWord] = useState("");
  const [englishTranslation, setEnglishTranslation] = useState("");
  const [notes, setNotes] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function loadEntries() {
    const { data } = await supabase
      .from("dictionary_entries")
      .select("id, zande_word, english_translation, notes")
      .eq("status", "approved")
      .order("zande_word", { ascending: true });
    setEntries((data ?? []) as Entry[]);
    setLoadingList(false);
  }

  useEffect(() => {
    loadEntries();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!userId) {
      setError("You must be logged in to contribute a word.");
      return;
    }
    if (zandeWord.trim().length === 0 || englishTranslation.trim().length === 0) {
      setError("Please fill in both the Zande word and its English translation.");
      return;
    }

    setSubmitting(true);
    const { error: insertError } = await supabase.from("dictionary_entries").insert({
      zande_word: censorText(zandeWord.trim()),
      english_translation: censorText(englishTranslation.trim()),
      notes: notes.trim() ? censorText(notes.trim()) : null,
      submitted_by: userId,
    });
    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setZandeWord("");
    setEnglishTranslation("");
    setNotes("");
    setDone(true);
  }

  const filtered = q.trim()
    ? entries.filter(
        (e) =>
          e.zande_word.toLowerCase().includes(q.toLowerCase()) ||
          e.english_translation.toLowerCase().includes(q.toLowerCase())
      )
    : entries;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Pa-Zande Dictionary</h1>
      <p className="font-body text-grey mb-8">
        A community-built dictionary of Zande words and their English translations. Every entry here has been
        reviewed by an admin before appearing publicly.
      </p>

      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search words..."
        className="w-full border border-border rounded-sm px-3 py-2 font-body mb-6 focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink"
      />

      {loadingList ? (
        <p className="font-body text-grey text-sm">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="font-body text-grey text-sm mb-10">
          {entries.length === 0 ? "No words yet — be the first to contribute one below." : "No matches found."}
        </p>
      ) : (
        <div className="divide-y divide-border mb-10">
          {filtered.map((e) => (
            <div key={e.id} className="py-3">
              <div className="font-display text-lg font-bold text-ink">{e.zande_word}</div>
              <div className="font-body text-ink/80">{e.english_translation}</div>
              {e.notes && <div className="font-body text-sm text-grey mt-1">{e.notes}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-border pt-8">
        <h2 className="font-display text-xl font-bold text-ink mb-3">Add a word</h2>
        {userId ? (
          done ? (
            <p className="font-body text-sm text-grey">
              Thank you — your word has been submitted and will appear once an admin reviews it.{" "}
              <button onClick={() => setDone(false)} className="text-accent hover:underline">
                Add another
              </button>
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-sm text-ink mb-1">Zande word</label>
                <input
                  type="text"
                  value={zandeWord}
                  onChange={(e) => setZandeWord(e.target.value)}
                  className="w-full border border-border rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink"
                />
              </div>
              <div>
                <label className="block font-body text-sm text-ink mb-1">English translation</label>
                <input
                  type="text"
                  value={englishTranslation}
                  onChange={(e) => setEnglishTranslation(e.target.value)}
                  className="w-full border border-border rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink"
                />
              </div>
              <div>
                <label className="block font-body text-sm text-ink mb-1">Notes <span className="text-grey">(optional — usage, context, dialect)</span></label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full border border-border rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink"
                />
              </div>
              {error && <p className="text-accent font-body text-sm">{error}</p>}
              <button
                type="submit"
                disabled={submitting}
                className="bg-accent text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:bg-accent-light transition-colors disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit word"}
              </button>
            </form>
          )
        ) : (
          <p className="font-body text-sm text-grey">
            <a href="/login" className="text-accent hover:underline">Log in</a> to contribute a word.
          </p>
        )}
      </div>
    </div>
  );
}
