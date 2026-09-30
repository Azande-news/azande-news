import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES = ["general", "culture", "history", "language", "community", "diaspora"];

type SearchResult = { title: string; snippet: string; url: string };

async function googleSearch(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    key: process.env.GOOGLE_SEARCH_API_KEY!,
    cx: process.env.GOOGLE_SEARCH_CSE_ID!,
    q: query,
    num: "10",
  });
  const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params.toString()}`);
  const data = await res.json();
  return (data.items ?? []).map((item: any) => ({
    title: item.title,
    snippet: item.snippet,
    url: item.link,
  }));
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .limit(1)
    .single();

  if (!adminProfile) {
    return NextResponse.json(
      { error: "No admin profile found to attribute the draft to" },
      { status: 500 }
    );
  }

  try {
    // Real search results, not model memory - this is what keeps drafts grounded in fact.
    const queries = [
      "Azande people news",
      "South Sudan Western Equatoria news this week",
      "Yambio news",
    ];
    const allResults: SearchResult[] = [];
    for (const q of queries) {
      const results = await googleSearch(q);
      allResults.push(...results);
    }

    if (allResults.length === 0) {
      return NextResponse.json({ status: "no-search-results-this-week" });
    }

    const searchResultsText = allResults
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
      .join("\n\n");

    const systemPrompt = `You are a careful news researcher for Azande News, a community site for the Azande people of South Sudan, DR Congo, the Central African Republic, and the diaspora.

Below are REAL web search results from this week. Use ONLY the information in these results. Do not add any fact, name, date, or detail that is not present in them - if it is not in the results, it does not go in the article.

Look for ONE genuine, specific news story clearly relevant to the Azande people or their regions (Western Equatoria, Yambio, Haut-Uele, Bas-Uele, or the Azande diaspora), fitting one of these categories: general, culture, history, language, community, diaspora.

If none of the results describe a genuine, specific, relevant story, respond with exactly this JSON and nothing else:
{"found": false}

If you find one, write it in BBC News house style: sentence-case headline, tight one-to-two sentence paragraphs, inverted pyramid, attribution close to each claim, British spelling, ending with a Sources section listing the real URLs used.

Respond with ONLY this JSON, no other text, no markdown fences:
{
  "found": true,
  "title": "sentence-case headline",
  "standfirst": "one or two sentence summary",
  "category": "one of: general, culture, history, language, community, diaspora",
  "body": "full HTML body using <p>, <h2>, <h3>, <ul><li> tags, ending with a Sources section listing the real URLs"
}

SEARCH RESULTS:
${searchResultsText}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Draft this week's article as instructed, or report that nothing genuine was found." },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);

    if (!parsed.found) {
      return NextResponse.json({ status: "no-verifiable-news-found-this-week" });
    }

    const category = ALLOWED_CATEGORIES.includes(parsed.category) ? parsed.category : "general";

    const { data: inserted, error } = await supabase
      .from("posts")
      .insert({
        title: parsed.title,
        standfirst: parsed.standfirst || null,
        body: parsed.body,
        category,
        author_id: adminProfile.id,
        status: "pending",
        ai_flagged: true,
        ai_flag_reason: "AI-drafted from real web search results. Review the sources listed in the article before publishing.",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "draft-created-pending-review", postId: inserted.id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
