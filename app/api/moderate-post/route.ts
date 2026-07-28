import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { title, body } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ flagged: false, reason: null, qualityOk: false });
  }

  const prompt = `You are a content moderation assistant for a community news site run by and for the Azande people. Review the following post title and body and answer two questions.

1. Should it be FLAGGED? Flag it ONLY if it contains: hate speech, harassment, targeted threats, obvious spam, sexually explicit content, or dangerous misinformation (e.g. false claims that could cause real-world harm). Do NOT flag it for containing strong opinions, criticism of public figures, political views, or ordinary news content.

2. Is it QUALITY content? Answer true only if it reads as genuine, coherent, on-topic community content (real news, culture, history, language, or community writing) — not gibberish, keyboard-mashing, an empty test post, or something with no real substance. A short but genuine, coherent post can still be quality:true.

Respond with ONLY a JSON object, no other text, in this exact format: {"flagged": true or false, "reason": "short explanation or empty string", "qualityOk": true or false}

Title: ${title}

Body: ${body}`;

  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ flagged: false, reason: null, qualityOk: false });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      flagged: !!parsed.flagged,
      reason: parsed.reason || null,
      qualityOk: !!parsed.qualityOk,
    });
  } catch {
    return NextResponse.json({ flagged: false, reason: null, qualityOk: false });
  }
}
