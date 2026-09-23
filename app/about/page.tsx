export const metadata = {
  title: "About",
  description:
    "Azande News is a community-run news and information project for the Azande people of Western Equatoria, South Sudan, and the worldwide diaspora.",
};

export default function AboutPage() {
  return (
    <div className="max-w-read">
      <h1 className="font-display text-canon sm:text-canon-lg font-medium text-ink mb-6">
        About Azande News
      </h1>

      <div className="font-body text-body-copy text-grey-dark space-y-5">
        <p>
          Azande News is a community-run project built to give the Azande
          people of Western Equatoria, South Sudan and the worldwide diaspora a shared place to read and share news, culture, history,
          and language.
        </p>
        <p>
          Anyone can read every story on this site without creating an account. Reading the news should never require a login. If you want to write a post, leave a comment or take part in the community, you will need a free account. That is the only thing login is used for.
        </p>
        <p>
          This is an open, community-contributed publication. Articles are written by members of the community, not by newsroom staff. If you see something that does not belong, use the report
          option on that post so it can be reviewed.
        </p>
        <p>
          Have a story to tell, a correction to flag or an idea for the site? Get in touch through the{" "}
          <a href="/contact" className="text-ink underline underline-offset-2 hover:no-underline">
            contact page
          </a>
          .
        </p>
      </div>
    </div>
  );
}



