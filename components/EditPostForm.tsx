"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/categories";
import RichTextEditor from "@/components/RichTextEditor";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type PublishMode = "now" | "draft" | "schedule";

type Post = {
  id: string;
  title: string;
  body: string;
  category: string;
  cover_image_url: string | null;
  status: string;
  publish_at: string | null;
};

function plainTextLength(html: string) {
  return html.replace(/<[^>]*>/g, "").trim().length;
}

function toLocalInputValue(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function initialMode(status: string): PublishMode {
  if (status === "draft") return "draft";
  if (status === "scheduled") return "schedule";
  return "now";
}

export default function EditPostForm({ post }: { post: Post }) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(post.title);
  const [category, setCategory] = useState(post.category);
  const [body, setBody] = useState(post.body);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(post.cover_image_url);
  const [publishMode, setPublishMode] = useState<PublishMode>(initialMode(post.status));
  const [scheduleDate, setScheduleDate] = useState(toLocalInputValue(post.publish_at));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Image is too large — please choose one under 5MB.");
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
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

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Your session expired — please log in again.");
      setLoading(false);
      return;
    }

    let coverImageUrl = post.cover_image_url;
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

    const status = publishMode === "now" ? "published" : publishMode === "draft" ? "draft" : "scheduled";
    const publishAt = publishMode === "schedule" ? new Date(scheduleDate).toISOString() : null;

    const { error: updateError } = await supabase
      .from("posts")
      .update({
        title: title.trim(),
        body,
        category,
        cover_image_url: coverImageUrl,
        status,
        publish_at: publishAt,
      })
      .eq("id", post.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    router.push(status === "published" ? `/posts/${post.id}` : "/admin");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl text-ink mb-2">Edit post</h1>
      <p className="font-body text-ink/70 mb-8">Changes go live immediately once saved.</p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-body text-sm text-ink mb-1">Title</label>
          <input
            type="text"
            required
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-border rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-ink mb-1">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-border rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-body text-sm text-ink mb-1">Cover photo <span className="text-ink/50">(optional)</span></label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full font-body text-sm file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:bg-accent file:text-white file:cursor-pointer"
          />
          {imagePreview && (
            <div className="w-full h-56 mt-3 rounded-sm overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imagePreview} alt="Cover preview" className="w-full h-full object-cover" />
            </div>
          )}
        </div>

        <div>
          <label className="block font-body text-sm text-ink mb-1">Content</label>
          <RichTextEditor content={body} onChange={setBody} />
        </div>

        <div>
          <label className="block font-body text-sm text-ink mb-2">Publishing</label>
          <div className="flex flex-wrap gap-4 font-body text-sm text-ink mb-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="publishMode" checked={publishMode === "now"} onChange={() => setPublishMode("now")} />
              Published
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="publishMode" checked={publishMode === "draft"} onChange={() => setPublishMode("draft")} />
              Draft
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name="publishMode" checked={publishMode === "schedule"} onChange={() => setPublishMode("schedule")} />
              Scheduled
            </label>
          </div>
          {publishMode === "schedule" && (
            <input
              type="datetime-local"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              className="border border-border rounded-sm px-3 py-2 font-body bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-accent"
            />
          )}
        </div>

        {error && <p className="text-accent font-body text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="bg-accent text-white px-6 py-3 rounded-sm hover:opacity-90 transition-opacity font-body disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push(`/posts/${post.id}`)}
            className="px-6 py-3 rounded-sm border border-border hover:bg-offwhite font-body"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
