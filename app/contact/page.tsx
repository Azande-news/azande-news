export const metadata = {
  title: "Contact — Azande News",
  description: "Get in touch with Azande News.",
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-3xl font-bold text-ink mb-6">
        Contact
      </h1>

      <div className="font-body text-grey-dark space-y-5 leading-relaxed">
        <p>
          Have a tip, a correction, or a question about Azande News? Reach
          out by email:
        </p>
        <p>
          <a
            href="mailto:azandenews@gmail.com"
            className="text-accent hover:underline text-lg font-medium"
          >
            azandenews@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
}
