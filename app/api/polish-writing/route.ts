import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { text } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || !text || text.trim().length === 0) {
    return NextResponse.json({ polished: null });
  }

  const prompt = `Correct the spelling and grammar of the following text. Keep the same meaning, tone, and all facts exactly as written. Do not add or remove information. Do not translate. Reply with ONLY the corrected text, nothing else, no explanation.

Text: ${text}`;

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
      return NextResponse.json({ polished: null });
    }

    const data = await response.json();
    const polished = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

    return NextResponse.json({ polished });
  } catch {
    return NextResponse.json({ polished: null });
  }
}
