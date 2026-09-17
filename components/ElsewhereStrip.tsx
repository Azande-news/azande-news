import Link from "next/link";

const ELSEWHERE_LINKS = [
  { href: "/live", label: "Live Updates" },
  { href: "/azande-people", label: "Azande Heritage" },
  { href: "/dictionary", label: "Zande Dictionary" },
  { href: "/posts/new", label: "Write a Post" },
];

export default function ElsewhereStrip() {
  return (
    <div className="pt-10 mt-10 border-t border-border">
      <h2 className="font-meta text-[11px] tracking-wider uppercase text-grey mb-4">
        Elsewhere on Azande News
      </h2>
      <div className="flex flex-wrap gap-x-8 gap-y-3">
        {ELSEWHERE_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="font-body text-sm font-medium text-ink hover:text-accent transition-colors"
          >
            {link.label} &rarr;
          </Link>
        ))}
      </div>
    </div>
  );
}
