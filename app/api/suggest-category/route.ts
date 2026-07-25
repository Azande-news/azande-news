import { NextResponse } from "next/server";
import { CATEGORIES } from "@/lib/categories";

export async function POST(req: Request) {
  const { title, body } = await req.json();
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ category: null });
  }

  const categoryList = CATEGORIES.map((c) => `${c.value}: ${c.description}`).join("\n");

  const prompt = `Based on this post title and body, which ONE category fits best? Reply with ONLY the category value (the word before the colon), nothing else.

Categories:
${categoryList}

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
      return NextResponse.json({ category: null });
    }

    const data = await response.json();
    const text = (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim().toLowerCase();
    const match = CATEGORIES.find((c) => text.includes(c.value));

    return NextResponse.json({ category: match?.value ?? null });
  } catch {
    return NextResponse.json({ category: null });
  }
}
