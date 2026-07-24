import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { title, body } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ flagged: false, reason: null });
  }

  const prompt = `You are a content moderation assistant for a community news site run by and for the Azande people. Review the following post title and body. Flag it ONLY if it contains: hate speech, harassment, targeted threats, obvious spam, sexually explicit content, or dangerous misinformation (e.g. false claims that could cause real-world harm). Do NOT flag it for containing strong opinions, criticism of public figures, political views, or ordinary news content. Respond with ONLY a JSON object, no other text, in this exact format: {"flagged": true or false, "reason": "short explanation or empty string"}

Title: ${title}

Body: ${body}`;

  try {
    if (!apiKey) {
      console.log("MODERATE-POST: no API key found in environment");
    }
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
      const errText = await response.text();
      console.log("MODERATE-POST: Gemini API error", response.status, errText);
      return NextResponse.json({ flagged: false, reason: null });
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json({
      flagged: !!parsed.flagged,
      reason: parsed.reason || null,
    });
  } catch (err) {
    console.log("MODERATE-POST: caught exception", err);
    return NextResponse.json({ flagged: false, reason: null });
  }
}


