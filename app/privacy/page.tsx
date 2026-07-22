export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-ink mb-6">Privacy Policy</h1>
      <div className="prose-article font-body text-ink/90 space-y-5">
        <p>Last updated: July 2026</p>
        <p>
          Azande News is a community-run project. We collect only the information needed to
          operate the site: your email address if you register an account or subscribe to our
          newsletter, and basic usage data (such as pages visited) to help us understand what
          readers find useful.
        </p>
        <h2 className="font-display text-xl font-bold text-ink pt-2">What we collect</h2>
        <p>
          Account holders provide an email address and a display name. Newsletter subscribers
          provide an email address. We do not collect payment information, government identifiers,
          or sensitive personal data.
        </p>
        <h2 className="font-display text-xl font-bold text-ink pt-2">How we use it</h2>
        <p>
          We use your email to manage your account, send newsletter updates you have opted into,
          and respond to reports or contact requests. We do not sell or share your personal
          information with third parties for advertising purposes.
        </p>
        <h2 className="font-display text-xl font-bold text-ink pt-2">Your choices</h2>
        <p>
          You can unsubscribe from the newsletter at any time, and you can request deletion of
          your account and associated data by contacting us through our Contact page.
        </p>
        <h2 className="font-display text-xl font-bold text-ink pt-2">Contact</h2>
        <p>
          Questions about this policy can be sent through our Contact page.
        </p>
      </div>
    </div>
  );
}
