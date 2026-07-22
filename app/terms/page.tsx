export const metadata = { title: "Terms of Use" };

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-ink mb-6">Terms of Use</h1>
      <div className="prose-article font-body text-ink/90 space-y-5">
        <p>Last updated: July 2026</p>
        <p>
          By using Azande News, you agree to these terms. This is a community platform for news,
          culture, history, and language relevant to the Azande people of Western Equatoria and
          the worldwide diaspora.
        </p>
        <h2 className="font-display text-xl font-bold text-ink pt-2">Content</h2>
        <p>
          Registered users may publish posts. You retain ownership of what you write, but by
          posting you grant Azande News a license to display it on the site. You are responsible
          for the accuracy and legality of content you submit.
        </p>
        <h2 className="font-display text-xl font-bold text-ink pt-2">Conduct</h2>
        <p>
          Do not post content that is defamatory, harassing, hateful, or that infringes on
          others&apos; rights. Posts that violate these terms may be removed, and accounts may be
          suspended, at the discretion of Azande News moderators.
        </p>
        <h2 className="font-display text-xl font-bold text-ink pt-2">No warranty</h2>
        <p>
          Azande News is provided as-is, run by community volunteers. We do our best to keep
          information accurate but make no guarantees about completeness or reliability.
        </p>
        <h2 className="font-display text-xl font-bold text-ink pt-2">Changes</h2>
        <p>
          These terms may be updated as the site evolves. Continued use of the site after changes
          means you accept the updated terms.
        </p>
      </div>
    </div>
  );
}
