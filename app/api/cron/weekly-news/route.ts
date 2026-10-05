import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES = ["general", "culture", "history", "language", "community", "diaspora"];

type SearchResult = { title: string; snippet: string; url: string };

type ImageCandidate = { url: string; description: string };

async function tavilySearch(query: string): Promise<{ results: SearchResult[]; images: ImageCandidate[] }> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      topic: "news",
      days: 10,
      max_results: 8,
      include_images: true,
      include_image_descriptions: true,
    }),
  });

  const rawText = await res.text();

  if (!res.ok) {
    throw new Error(`Tavily search failed (HTTP ${res.status}): ${rawText}`);
  }

  const data = JSON.parse(rawText);

  if (data.error) {
    throw new Error(`Tavily search error: ${data.error}`);
  }

  if (!Array.isArray(data.results)) {
    throw new Error(`Tavily returned an unexpected shape: ${rawText}`);
  }

  const results = data.results.map((item: any) => ({
    title: item.title,
    snippet: item.content,
    url: item.url,
  }));

  const images: ImageCandidate[] = Array.isArray(data.images)
    ? data.images.map((img: any) =>
        typeof img === "string"
          ? { url: img, description: "" }
          : { url: img.url, description: img.description ?? "" }
      )
    : [];

  return { results, images };
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
    // Covers all three Azande regions plus the diaspora, not just South Sudan.
    const queries = [
      "Azande people",
      "Yambio South Sudan",
      "Western Equatoria South Sudan",
      "Dungu DR Congo",
      "Isiro DR Congo",
      "Haut-Uele DR Congo",
      "Obo Central African Republic",
      "Azande diaspora",
    ];
    const rawResults: SearchResult[] = [];
    const rawImages: ImageCandidate[] = [];
    for (const q of queries) {
      const { results, images } = await tavilySearch(q);
      rawResults.push(...results);
      rawImages.push(...images);
    }

    const seenUrls = new Set<string>();
    const allResults = rawResults.filter((r) => {
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

    const seenImageUrls = new Set<string>();
    const allImages = rawImages
      .filter((img) => {
        if (!img.url || seenImageUrls.has(img.url)) return false;
        seenImageUrls.add(img.url);
        return true;
      })
      .slice(0, 15);

    if (allResults.length === 0) {
      return NextResponse.json({ status: "no-search-results-this-week" });
    }

    const trimmedResults = allResults.slice(0, 30).map((r) => ({
      ...r,
      snippet: r.snippet.length > 400 ? r.snippet.slice(0, 400) + "..." : r.snippet,
    }));

    const searchResultsText = trimmedResults
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
      .join("\n\n");

    const imageCandidatesText = allImages.length > 0
      ? allImages
          .map((img, i) => `[Image ${i + 1}] URL: ${img.url}${img.description ? `\nDescription: ${img.description}` : ""}`)
          .join("\n\n")
      : "No candidate images were found.";

    const systemPrompt = `You are a careful news researcher for Azande News, a community site for the Azande people of South Sudan, DR Congo, the Central African Republic, and the diaspora.

Below are REAL web search results from this week. Use ONLY the information in these results. Do not add any fact, name, date, or detail that is not present in them - if it is not in the results, it does not go in the article.

Look for ONE genuine, specific news story clearly relevant to the Azande people or their regions (Western Equatoria, Yambio, Haut-Uele, Bas-Uele, or the Azande diaspora), fitting one of these categories: general, culture, history, language, community, diaspora.

If none of the results describe a genuine, specific, relevant story, respond with exactly this JSON and nothing else:
{"found": false}

FRESHNESS RULE: Unless the category is "history", the story you choose must describe a specific event with a specific day-level date, day of the week, or clearly recent timeframe (such as "on Friday" or "on 17 September") stated IN THE SOURCE for when that event itself happened - not just when the article was published or indexed. Before selecting a story, explicitly check: does the source give a specific day for the triggering event, or only vague background dates such as when a group "formed in 2023" or received training "in 2024"? Background or founding dates are NOT sufficient to establish freshness. A story that is really ongoing analysis, retrospective, or old context dressed up with a recent publish date must be rejected: respond {"found": false} rather than present it as current news. For "history" category stories, older, well-documented material is fine, but state the historical period or date being discussed.

DATES: Every article must state, in the body text itself, the specific date, day, or clear timeframe when the described event took place, drawn directly from the source (for example "On Friday, the World Health Organization said..." or "On 17 September, ..."). Never leave a news story without a specific time reference - this is a core requirement for a complete article, not optional detail. If you cannot find such a date in the source, that is itself a sign the story fails the freshness rule above.

COMPLETENESS IS A FACTUAL-ACCURACY REQUIREMENT, NOT A STYLE CHOICE. If the source material you draw from contains serious findings - human rights allegations, casualties, deaths, war crimes findings, criminal conduct, displacement, or other significant harms - connected to the subject of your article, you MUST include them, even if the main angle of the story is something else (such as a territorial gain, an appointment, or an achievement). Omitting documented serious harm while reporting only a neutral or positive framing of the same subject is a factual-completeness failure, not an acceptable editorial choice. When in doubt, include more from the source rather than less.

DO NOT SOFTEN OR GENERALIZE DOCUMENTED FINDINGS. If the source names a specific finding - such as a named report or body reaching a specific conclusion, a specific casualty count, a specific documented incident, or a direct quote describing the severity of something - you must state that specific finding, in specific terms, not replace it with a vague generic sentence like "human rights observers have raised concerns" or "could exacerbate tensions." Name who found what, and what exactly was found, as precisely as the source states it.

If you find a genuine story, write it in BBC News house style: sentence-case headline, tight one-to-two sentence paragraphs, inverted pyramid, attribution close to each claim, British spelling, ending with a Sources section listing the real URLs used. The article must reflect the full picture given in the sources, not just the least controversial part of it.

BEFORE YOU FINALIZE: check your own draft against three things - (1) does the body state a specific date or day for the event, (2) if the source names specific serious findings, does your draft name them specifically rather than vaguely, (3) is the coverImageUrl either a genuinely matching real image or null. If any of these fail, fix the draft before responding, or respond {"found": false} if the story cannot meet these requirements.

IMAGE SELECTION: Below the search results is a list of real candidate images found alongside them. If, and only if, one of these images clearly and specifically depicts the story you are writing about (matching its description to the subject), select its exact URL as the cover image. Never guess or select an image that is only loosely related, generic, or unrelated (such as a stock photo, an unrelated location, or a different story). If no candidate image clearly matches, set coverImageUrl to null - do not force a mismatched image onto the story.

Respond with ONLY this JSON, no other text, no markdown fences:
{
  "found": true,
  "title": "sentence-case headline",
  "standfirst": "one or two sentence summary",
  "category": "one of: general, culture, history, language, community, diaspora",
  "body": "full HTML body using <p>, <h2>, <h3>, <ul><li> tags, with specific dates stated in the text, ending with a Sources section listing the real URLs",
  "coverImageUrl": "the exact URL of a clearly matching candidate image, or null if none match",
  "coverImageCredit": "the publication or website name the image came from (based on its domain), or null",
  "coverImageCaption": "a short, factual caption describing what the image shows, or null"
}

SEARCH RESULTS:
${searchResultsText}

CANDIDATE IMAGES:
${imageCandidatesText}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: "Draft this week's article as instructed, or report that nothing genuine was found." },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    const groqRawText = await response.text();

    if (!response.ok) {
      throw new Error(`Groq API error (HTTP ${response.status}): ${groqRawText}`);
    }

    const data = JSON.parse(groqRawText);
    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error(`Groq returned no content: ${groqRawText}`);
    }

    const parsed = JSON.parse(text);

    const debugMode = request.nextUrl.searchParams.get("debug") === "1";
    if (debugMode) {
      return NextResponse.json({
        debug: true,
        searchResultsCount: allResults.length,
        searchResults: allResults,
        imageCandidatesCount: allImages.length,
        imageCandidates: allImages,
        groqDecision: parsed,
      });
    }

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
        cover_image_url: parsed.coverImageUrl || null,
        image_credit: parsed.coverImageCredit || null,
        image_caption: parsed.coverImageCaption || null,
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
