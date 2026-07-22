export const metadata = { title: "Editorial Standards" };

export default function EditorialStandardsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-ink mb-6">Editorial Standards</h1>
      <div className="prose-article font-body text-ink/90 space-y-5">
        <p>
          Azande News is a community-run publication. We aim to report and share news, culture,
          and history relevant to the Azande people accurately and fairly.
        </p>
        <h2 className="font-display text-xl font-bold text-ink pt-2">Accuracy</h2>
        <p>
          Contributors are expected to verify facts before publishing. When we get something
          wrong, we correct it as soon as possible and note the correction on the article.
        </p>
        <h2 className="font-display text-xl font-bold text-ink pt-2">Fairness</h2>
        <p>
          We aim to represent community voices and perspectives fairly, and to avoid content that
          unfairly targets individuals or groups.
        </p>
        <h2 className="font-display text-xl font-bold text-ink pt-2">Corrections</h2>
        <p>
          If you believe something we published is inaccurate, please use the Report button on the
          article or contact us directly. We review every report.
        </p>
        <h2 className="font-display text-xl font-bold text-ink pt-2">Community moderation</h2>
        <p>
          Posts and comments are moderated by our admin team to keep the platform respectful and
          reliable for everyone in the Azande community, at home and in the diaspora.
        </p>
      </div>
    </div>
  );
}
