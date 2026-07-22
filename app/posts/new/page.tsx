"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/categories";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

export default function NewPostPage() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("general");
  const [body, setBody] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    if (body.trim().length < 10) {
      setError("Your post needs a bit more content.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be logged in to post.");
      setLoading(false);
      return;
    }

    let coverImageUrl: string | null = null;

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, imageFile);

      if (uploadError) {
        setError(`Image upload failed: ${uploadError.message}`);
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(path);
      coverImageUrl = publicUrlData.publicUrl;
    }

    const { data, error: insertError } = await supabase
      .from("posts")
      .insert({
        title: title.trim(),
        body: body.trim(),
        category,
        author_id: user.id,
        cover_image_url: coverImageUrl,
      })
      .select("id")
      .single();

    setLoading(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    router.push(`/posts/${data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-ink mb-2">
        Write a post
      </h1>
      <p className="font-body text-grey mb-8">
        This will be published to the world immediately. Please write
        respectfully &mdash; posts can be removed if they break community
        guidelines.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block font-body text-sm text-ink mb-1">
            Title
          </label>
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
          <label className="block font-body text-sm text-ink mb-1">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border border-border rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-accent bg-paper text-ink"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-body text-sm text-ink mb-1">
            Cover photo <span className="text-grey">(optional)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full font-body text-sm file:mr-4 file:py-2 file:px-4 file:rounded-sm file:border-0 file:bg-ink file:text-paper file:cursor-pointer hover:file:bg-accent"
          />
          {imagePreview && (
            <div className="w-full h-56 mt-3 overflow-hidden border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Cover preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block font-body text-sm text-ink mb-1">
            Content
          </label>
          <textarea
            required
            rows={12}
            maxLength={20000}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full border border-border rounded-sm px-3 py-2 font-body leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <div className="text-right font-meta text-xs text-grey mt-1">
            {body.length}/20000
          </div>
        </div>

        {error && <p className="text-accent font-body text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-accent text-paper px-6 py-3 rounded-sm hover:bg-accent-dark transition-colors font-body font-medium disabled:opacity-60"
        >
          {loading ? "Publishing…" : "Publish to Azande News"}
        </button>
      </form>
    </div>
  );
}

