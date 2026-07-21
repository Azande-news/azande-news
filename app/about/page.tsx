export const metadata = {
  title: "About — Azande News",
  description:
    "Azande News is a community-run news and information project for the Azande people of Western Equatoria, South Sudan, and the worldwide diaspora.",
};

export default function AboutPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-ink mb-6">
        About Azande News
      </h1>

      <div className="font-body text-grey-dark space-y-5 leading-relaxed">
        <p>
          Azande News is a community-run project built to give the Azande
          people of Western Equatoria, South Sudan, and the worldwide
          diaspora a shared place to read and share news, culture, history,
          and language.
        </p>
        <p>
          Anyone can read every story on this site without creating an
          account. Reading the news should never require a login. If you
          want to write a post, leave a comment, or take part in the
          community, you&apos;ll need a free account &mdash; that&apos;s the
          only thing login is used for.
        </p>
        <p>
          This is an open, community-contributed publication. Articles are
          written by members of the community itself, not a newsroom staff.
          If you see something that doesn&apos;t belong, use the report
          option on that post so it can be reviewed.
        </p>
        <p>
          Have a story to tell, a correction to flag, or an idea for the
          site? Get in touch through the{" "}
          <a href="/contact" className="text-accent hover:underline">
            contact page
          </a>
          .
        </p>
      </div>
    </div>
  );
}
