import DOMPurify from "isomorphic-dompurify";

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, `"`)
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "strong", "em", "u", "s", "a", "ul", "ol", "li",
      "h2", "h3", "blockquote", "img", "code", "pre",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "target", "rel"],
  });
}
