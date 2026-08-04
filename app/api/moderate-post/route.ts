import { NextResponse } from "next/server";

async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    return { data: base64, mimeType: contentType };
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  const { title, body, imageUrl } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ flagged: false, reason: null, qualityOk: false });
  }

  const prompt = `You are a content moderation assistant for a community news site run by and for the Azande people. Review the following post title, body, and (if provided) an attached image, and answer two questions.

1. Should it be FLAGGED? Flag it ONLY if the text OR the image contains: hate speech, harassment, targeted threats, obvious spam, sexually explicit or graphic violent content, or dangerous misinformation (e.g. false claims that could cause real-world harm). Do NOT flag it for containing strong opinions, criticism of public figures, political views, or ordinary news content or images.

2. Is it QUALITY content? Answer true only if the text reads as genuine, coherent, on-topic community content — not gibberish, keyboard-mashing, an empty test post, or something with no real substance. A short but genuine, coherent post can still be quality:true. If there is no image, judge quality on text alone.

Respond with ONLY a JSON object, no other text, in this exact format: {"flagged": true or false, "reason": "short explanation or empty string", "qualityOk": true or false}

Title: ${title}

Body: ${body}`;

  const parts: Array<Record<string, unknown>> = [{ text: prompt }];

  if (imageUrl) {
    const image = await fetchImageAsBase64(imageUrl);
    if (image) {
      parts.push({
        inline_data: {
          mime_type: image.mimeType,
          data: image.data,
        },
      });
    }
  }

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
          contents: [{ parts }],
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
