"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, CATEGORY_DESCRIPTIONS } from "@/lib/categories";
import RichTextEditor from "@/components/RichTextEditor";
import { censorText } from "@/lib/profanity";
import { getVideoEmbedUrl, getAudioEmbedUrl } from "@/lib/embeds";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type PublishMode = "now" | "draft" | "schedule";

function plainTextLength(html: string) {
  return html.replace(/<[^>]*>/g, "").trim().length;
}

function stripHtmlTags(html: string) {
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function extractImageUrls(html: string): string[] {
  const matches = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)];
  return matches.map((m) => m[1]);
}

function textToParagraphs(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<p>${line}</p>`)
    .join("");
}

export default function NewPostPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageCaption, setImageCaption] = useState("");
  const [imageCredit, setImageCredit] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [publishMode, setPublishMode] = useState<PublishMode>("now");
  const [scheduleDate, setScheduleDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [suggestingCategory, setSuggestingCategory] = useState(false);
  const [categoryNote, setCategoryNote] = useState<string | null>(null);
  const [polishingTitle, setPolishingTitle] = useState(false);
  const [polishingBody, setPolishingBody] = useState(false);

  const videoUrlValid = videoUrl.trim().length === 0 || getVideoEmbedUrl(videoUrl.trim()) !== null;
  const audioUrlValid = audioUrl.trim().length === 0 || getAudioEmbedUrl(audioUrl.trim()) !== null;

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image is too large. Please choose one under 5MB.");
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSuggestCategory() {
    if (title.trim().length === 0 && plainTextLength(body) === 0) {
      setCategoryNote("Write a title or some content first.");
      return;
    }
    setSuggestingCategory(true);
    setCategoryNote(null);
    try {
      const res = await fetch("/api/suggest-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body: stripHtmlTags(body) }),
      });
      const data = await res.json();
      if (data.category) {
        setCategory(data.category);
        const match = CATEGORIES.find((c) => c.value === data.category);
        setCategoryNote(`Suggested: ${match?.label ?? data.category}`);
      } else {
        setCategoryNote("Could not suggest a category. Please choose one yourself.");
      }
    } catch {
      setCategoryNote("Could not suggest a category. Please choose one yourself.");
    }
    setSuggestingCategory(false);
  }

  async function handlePolishTitle() {
    if (title.trim().length === 0) return;
    setPolishingTitle(true);
    try {
      const res = await fetch("/api/polish-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: title }),
      });
      const data = await res.json();
      if (data.polished) setTitle(data.polished.trim());
    } catch {
      // silently ignore
    }
    setPolishingTitle(false);
  }

  async function handlePolishBody() {
    const plain = stripHtmlTags(body);
    if (plain.length === 0) return;
    const confirmed = window.confirm(
      "This will fix spelling and grammar, but any bold, headings, or lists you added will be removed. Continue?"
    );
    if (!confirmed) return;

    setPolishingBody(true);
    try {
      const res = await fetch("/api/polish-writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: plain }),
      });
      const data = await res.json();
      if (data.polished) setBody(textToParagraphs(data.polished));
    } catch {
      // silently ignore
    }
    setPolishingBody(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (title.trim().length < 3) {
      setError("Title is too short.");
      return;
    }
    if (plainTextLength(body) < 10) {
      setError("Your post needs a bit more content.");
      return;
    }
    if (publishMode === "schedule" && !scheduleDate) {
      setError("Please choose a date and time to schedule this post.");
      return;
    }
    if (publishMode === "schedule" && new Date(scheduleDate).getTime() <= Date.now()) {
      setError("Scheduled time must be in the future.");
      return;
    }
    if (!videoUrlValid) {
      setError("That video link isn't recognized. Please use a YouTube or Vimeo link.");
      return;
    }
    if (!audioUrlValid) {
      setError("That audio link isn't recognized. Please use a SoundCloud link.");
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be logged in to post.");
      setLoading(false);
      return;
    }

    let coverImageUrl: string | null = null;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("post-images").upload(path, imageFile);
      if (uploadError) {
        setError(`Image upload failed: ${uploadError.message}`);
        setLoading(false);
        return;
      }
      const { data: publicUrlData } = supabase.storage.from("post-images").getPublicUrl(path);
      coverImageUrl = publicUrlData.publicUrl;
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id)
      .gte("created_at", tenMinutesAgo);

    if ((recentCount ?? 0) >= 5) {
      setError("You are posting too quickly. Please wait a few minutes and try again.");
      setLoading(false);
      return;
    }

    const { count: publishedCount } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id)
      .in("status", ["published", "pending"]);

    const isNewAuthor = (publishedCount ?? 0) < 3;
    const status = publishMode === "now" ? "published" : publishMode === "draft" ? "draft" : "scheduled";
    let finalStatus = status;
    const publishAt = publishMode === "schedule" ? new Date(scheduleDate).toISOString() : null;

    let aiFlagged = false;
    let aiFlagReason: string | null = null;
    if (status === "published") {
      let qualityOk = false;
      try {
        const modRes = await fetch("/api/moderate-post", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: title.trim(), body, imageUrl: coverImageUrl, bodyImageUrls: extractImageUrls(body) }),
        });
        const modData = await modRes.json();
        qualityOk = !!modData.qualityOk;
        if (modData.flagged) {
          aiFlagged = true;
          aiFlagReason = modData.reason;
        }
      } catch {
        // moderation check failed silently; treated as not quality-verified
      }

      if (aiFlagged) {
        finalStatus = "pending";
      } else if (isNewAuthor && !qualityOk) {
        finalStatus = "pending";
      } else {
        finalStatus = "published";
      }
    }

    const { data, error: insertError } = await supabase
      .from("posts")
      .insert({
        title: censorText(title.trim()),
        body: censorText(body),
        category,
        author_id: user.id,
        cover_image_url: coverImageUrl,
        image_caption: imageCaption.trim() || null,
        image_credit: imageCredit.trim() || null,
        video_url: videoUrl.trim() || null,
        audio_url: audioUrl.trim() || null,
        status: finalStatus,
        publish_at: publishAt,
        ai_flagged: aiFlagged,
        ai_flag_reason: aiFlagReason,
      })
      .select("id")
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push(finalStatus === "published" ? `/posts/${data.id}` : "/admin");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-canon sm:text-canon-lg font-medium text-ink mb-2">Write a post</h1>
      <p className="font-body text-grey mb-8">Publish immediately, save a draft, or schedule it for later.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-body text-sm text-ink">Title</label>
            <button type="button" onClick={handlePolishTitle} disabled={polishingTitle} className="text-xs text-ink underline underline-offset-2 hover:no-underline disabled:opacity-50">
              {polishingTitle ? "Fixing..." : "Fix spelling & grammar"}
            </button>
          </div>
          <input
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-border px-3 py-2 font-body focus:outline-none focus:border-ink"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-body text-sm text-ink">Category</label>
            <button type="button" onClick={handleSuggestCategory} disabled={suggestingCategory} className="text-xs text-ink underline underline-offset-2 hover:no-underline disabled:opacity-50">
              {suggestingCategory ? "Thinking..." : "Suggest a category for me"}
            </button>
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-border px-3 py-2 font-body focus:outline-none focus:border-ink bg-paper text-ink"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}: {c.description}</option>
            ))}
          </select>
          {categoryNote && <p className="text-xs text-grey mt-1">{categoryNote}</p>}
        </div>

        <div className="border border-rule p-4 space-y-3">
          <label className="block font-meta text-brevier font-semibold text-ink">Cover photo <span className="text-grey font-normal">(optional)</span></label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full font-body text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-ink file:text-paper file:cursor-pointer hover:file:bg-accent"
          />
          {imagePreview && (
            <>
              <div className="w-full aspect-[16/9] overflow-hidden border border-border bg-offwhite">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imagePreview} alt="Cover preview" className="w-full h-full object-cover" />
              </div>
              <div>
                <label className="block font-body text-sm text-ink mb-1">Caption</label>
                <input
                  type="text"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  placeholder="What does this photo show?"
                  className="w-full border border-border px-3 py-2 font-body text-sm focus:outline-none focus:border-ink"
                />
              </div>
              <div>
                <label className="block font-body text-sm text-ink mb-1">Photo credit <span className="text-grey">(optional)</span></label>
                <input
                  type="text"
                  value={imageCredit}
                  onChange={(e) => setImageCredit(e.target.value)}
                  placeholder="e.g. Your name, or the photographer's"
                  className="w-full border border-border px-3 py-2 font-body text-sm focus:outline-none focus:border-ink"
                />
              </div>
            </>
          )}
        </div>

        <div>
          <label className="block font-body text-sm text-ink mb-1">Video link <span className="text-grey">(optional)</span></label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Paste a YouTube or Vimeo link"
            className="w-full border border-border px-3 py-2 font-body text-sm focus:outline-none focus:border-ink"
          />
          {!videoUrlValid && <p className="text-xs text-accent mt-1">That link isn't recognized. Use a YouTube or Vimeo link.</p>}
        </div>

        <div>
          <label className="block font-body text-sm text-ink mb-1">Audio link <span className="text-grey">(optional)</span></label>
          <input
            type="url"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="Paste a SoundCloud link"
            className="w-full border border-border px-3 py-2 font-body text-sm focus:outline-none focus:border-ink"
          />
          {!audioUrlValid && <p className="text-xs text-accent mt-1">That link isn't recognized. Use a SoundCloud link.</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-body text-sm text-ink">Content</label>
            <button type="button" onClick={handlePolishBody} disabled={polishingBody} className="text-xs text-ink underline underline-offset-2 hover:no-underline disabled:opacity-50">
              {polishingBody ? "Fixing..." : "Fix spelling & grammar"}
            </button>
          </div>
          <RichTextEditor content={body} onChange={setBody} />
        </div>

        <div>
          <label className="block font-body text-sm text-ink mb-2">Publishing</label>
          <div className="flex flex-wrap gap-4 font-body text-sm text-ink mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="publishMode" checked={publishMode === "now"} onChange={() => setPublishMode("now")} />
              Publish now
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="publishMode" checked={publishMode === "draft"} onChange={() => setPublishMode("draft")} />
              Save as draft
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="publishMode" checked={publishMode === "schedule"} onChange={() => setPublishMode("schedule")} />
              Schedule
            </label>
          </div>
          {publishMode === "schedule" && (
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="border border-border px-3 py-2 font-body bg-paper text-ink focus:outline-none focus:border-ink"
            />
          )}
        </div>

        {error && <p className="text-accent font-body text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-ink text-paper px-6 py-3 hover:bg-accent-dark transition-colors font-meta text-brevier font-semibold disabled:opacity-60"
        >
          {loading ? "Saving…" : publishMode === "now" ? "Publish to Azande News" : publishMode === "draft" ? "Save draft" : "Schedule post"}
        </button>
      </form>
    </div>
  );
}
