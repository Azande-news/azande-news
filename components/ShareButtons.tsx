"use client";
import { useState } from "react";

export default function ShareButtons({
  postId,
  postTitle,
}: {
  postId: string;
  postTitle: string;
}) {
  const [copied, setCopied] = useState(false);
  const url = `https://azande-news.vercel.app/posts/${postId}`;
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(postTitle);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable, ignore
    }
  }

  const links = [
    { label: "X", href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { label: "WhatsApp", href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="font-meta text-[11px] tracking-widest uppercase text-grey mr-1">
        Share
      </span>
      {links.map((link) => {
        const linkClass = "text-xs font-medium text-grey hover:text-ink border border-border rounded-sm px-2.5 py-1 transition-colors";
        return <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>{link.label}</a>;
      })}
      <button
        onClick={handleCopy}
        className="text-xs font-medium text-grey hover:text-ink border border-border rounded-sm px-2.5 py-1 transition-colors"
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
