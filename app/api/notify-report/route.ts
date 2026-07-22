import { NextResponse } from "next/server";

// This runs only on the server. RESEND_API_KEY is never sent to the
// browser (unlike NEXT_PUBLIC_ variables), which is exactly right since
// it's a secret that can send email as your account.
export async function POST(request: Request) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;

  // If email isn't configured, don't fail the report — just skip silently.
  if (!apiKey || !adminEmail) {
    return NextResponse.json({ skipped: true });
  }

  const body = await request.json();
  const postTitle = String(body.postTitle ?? "").slice(0, 200);
  const reason = String(body.reason ?? "").slice(0, 500);
  const postId = String(body.postId ?? "");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const postLink = siteUrl ? `${siteUrl}/posts/${postId}` : `/posts/${postId}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Azande News <onboarding@resend.dev>",
        to: adminEmail,
        subject: "A post was reported on Azande News",
        html: `
          <p><strong>Post:</strong> ${escapeHtml(postTitle)}</p>
          <p><strong>Reason given:</strong> ${escapeHtml(reason)}</p>
          <p><a href="${postLink}">View the post</a></p>
          <p>Resolve it from your <a href="${siteUrl}/admin">admin dashboard</a>.</p>
        `,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Resend error:", text);
      return NextResponse.json({ sent: false }, { status: 200 });
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("Failed to send report notification:", err);
    // Never fail the user's report just because email failed.
    return NextResponse.json({ sent: false }, { status: 200 });
  }
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
