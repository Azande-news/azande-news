import { NextRequest, NextResponse } from "next/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const ALLOWED_CATEGORIES = ["general", "culture", "history", "language", "community", "diaspora"];

type SearchResult = { title: string; snippet: string; url: string };

type ImageCandidate = { url: string; description: string };

type ResolvedImage = { url: string; credit: string | null; caption: string | null };

const JUNK_TITLE_PATTERNS = [
  /prayer time/i,
  /salah/i,
  /local time/i,
  /^time in /i,
  /sunrise|sunset/i,
  /recruitment/i,
  /volunteering position/i,
  /air quality/i,
];

const SOCIAL_HOSTS = [
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "youtube.com",
  "youtu.be",
  "twitter.com",
  "x.com",
];

const RELEVANCE_TERMS = [
  "azande", "azandé", "zande", "yambio", "western equatoria", "tombura", "tambura",
  "mundri", "ibba", "nzara", "ezo", "haut-uele", "haut-uélé", "bas-uele", "bas-uélé",
  "dungu", "isiro", "obo", "zemio", "rafai", "rafaï",
];

const MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december";
const DATE_SIGNAL = new RegExp(
  `\\b(?:${MONTHS})\\s+\\d{1,2}\\b|\\b\\d{1,2}\\s+(?:${MONTHS})\\b|\\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\\b`,
  "i"
);

function relevanceScore(r: SearchResult): number {
  const text = `${r.title} ${r.snippet ?? ""}`.toLowerCase();
  let score = 0;
  for (const term of RELEVANCE_TERMS) {
    if (new RegExp(`(^|[^a-zé])${term}([^a-zé]|$)`).test(text)) score += 1;
  }
  if (DATE_SIGNAL.test(text)) score += 2;
  return score;
}

function isSocialHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return SOCIAL_HOSTS.some((h) => host === h || host.endsWith("." + h));
  } catch {
    return false;
  }
}

function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .split(/[^a-z0-9à-ÿ]+/)
      .filter((w) => w.length > 3)
  );
}

function titleSimilarity(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  a.forEach((w) => {
    if (b.has(w)) shared += 1;
  });
  const union = a.size + b.size - shared;
  return union > 0 ? shared / union : 0;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getAttr(tag: string, name: string): string | null {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, "i"));
  if (!m) return null;
  return m[1] ?? m[2] ?? null;
}

function getMetaContent(html: string, wantedKeys: string[]): string | null {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const wanted of wantedKeys) {
    for (const tag of metaTags) {
      const key = (getAttr(tag, "property") ?? getAttr(tag, "name") ?? "").toLowerCase();
      if (key !== wanted) continue;
      const content = getAttr(tag, "content");
      if (content && content.trim()) return decodeHtmlEntities(content.trim());
    }
  }
  return null;
}

// Fetches the lead image the publisher attached to this exact article (its og:image).
async function fetchOgImage(pageUrl: string): Promise<ResolvedImage | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(pageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AzandeNewsBot/1.0; +https://azande-news.vercel.app)",
          Accept: "text/html",
        },
        signal: controller.signal,
        redirect: "follow",
      });
      if (!res.ok) return null;

      const html = (await res.text()).slice(0, 300000);
      const rawImage = getMetaContent(html, ["og:image", "og:image:url", "twitter:image"]);
      if (!rawImage) return null;

      const absolute = new URL(rawImage, pageUrl);
      if (absolute.protocol !== "https:") return null;

      const siteName = getMetaContent(html, ["og:site_name"]);
      const alt = getMetaContent(html, ["og:image:alt", "twitter:image:alt"]);
      const credit = siteName ?? new URL(pageUrl).hostname.replace(/^www\./, "");
      return { url: absolute.toString(), credit, caption: alt };
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

// Picks the cover image. Only ever uses URLs that came from real search results.
async function resolveCoverImage(
  parsed: any,
  results: SearchResult[],
  candidates: ImageCandidate[]
): Promise<ResolvedImage | null> {
  const knownUrls = new Set(results.map((r) => r.url));
  const sourceUrl = typeof parsed.primarySourceUrl === "string" ? parsed.primarySourceUrl.trim() : "";

  if (sourceUrl && sourceUrl.startsWith("https://") && knownUrls.has(sourceUrl)) {
    const og = await fetchOgImage(sourceUrl);
    if (og && !/logo|favicon|placeholder|sprite/i.test(og.url)) return og;
  }

  const chosen = typeof parsed.coverImageUrl === "string" ? parsed.coverImageUrl.trim() : "";
  if (chosen) {
    const match = candidates.find((c) => c.url === chosen);
    if (match && match.url.startsWith("https://")) {
      let credit: string | null = typeof parsed.coverImageCredit === "string" ? parsed.coverImageCredit : null;
      if (!credit) {
        try {
          credit = new URL(match.url).hostname.replace(/^www\./, "");
        } catch {
          credit = null;
        }
      }
      const caption =
        typeof parsed.coverImageCaption === "string" ? parsed.coverImageCaption : match.description || null;
      return { url: match.url, credit, caption };
    }
  }

  return null;
}

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
      .slice(0, 6);

    if (allResults.length === 0) {
      return NextResponse.json({ status: "no-search-results-this-week" });
    }

    const MAX_SNIPPET_CHARS = 1500;
    const RESULTS_CHAR_BUDGET = 8000;

    const ranked = allResults
      .filter((r) => !JUNK_TITLE_PATTERNS.some((p) => p.test(r.title)) && !isSocialHost(r.url))
      .map((r, index) => ({ r, index, score: relevanceScore(r) }))
      .sort((a, b) => b.score - a.score || a.index - b.index);

    const trimmedResults: SearchResult[] = [];
    const keptTitleTokens: Set<string>[] = [];
    let usedChars = 0;

    for (const { r } of ranked) {
      const tokens = titleTokens(r.title);
      if (keptTitleTokens.some((k) => titleSimilarity(tokens, k) >= 0.4)) continue;

      const raw = r.snippet ?? "";
      const snippet = raw.length > MAX_SNIPPET_CHARS ? raw.slice(0, MAX_SNIPPET_CHARS) + "..." : raw;
      const cost = r.title.length + snippet.length + r.url.length + 24;
      if (usedChars + cost > RESULTS_CHAR_BUDGET) continue;

      trimmedResults.push({ ...r, snippet });
      keptTitleTokens.push(tokens);
      usedChars += cost;
    }

    if (trimmedResults.length === 0) {
      return NextResponse.json({ status: "no-usable-results-this-week" });
    }

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

NEVER INVENT PLAUSIBLE-SOUNDING FILLER. Do not add reactions, causes, consequences, named officials, follow-up actions, or background that are not explicitly stated in the source text, even if they sound like the kind of thing that would plausibly happen in a story like this. Examples of what NOT to do: inventing that a release happened "following negotiations" when the source doesn't say why it happened; inventing that officials "urged" some response when no such statement is in the source; inventing that "local NGOs pledged support" or similar generic follow-up when it is not stated. If the source material only supports a short article, write a SHORT article using only confirmed facts - do not pad it out to a standard length with invented specifics. Every sentence must be traceable to something actually stated in the source text above. A short, fully accurate article is always better than a longer one containing invented plausible-sounding material.

Look for ONE genuine, specific news story clearly relevant to the Azande people or their regions (Western Equatoria, Yambio, Haut-Uele, Bas-Uele, or the Azande diaspora), fitting one of these categories: general, culture, history, language, community, diaspora.

If none of the results describe a genuine, specific, relevant story, respond with exactly this JSON and nothing else:
{"found": false}

FRESHNESS RULE: Unless the category is "history", the story you choose must describe a specific event with a specific day-level date, day of the week, or clearly recent timeframe (such as "on Friday" or "on 17 September") stated IN THE SOURCE for when that event itself happened - not just when the article was published or indexed. Before selecting a story, explicitly check: does the source give a specific day for the triggering event, or only vague background dates such as when a group "formed in 2023" or received training "in 2024"? Background or founding dates are NOT sufficient to establish freshness. A story that is really ongoing analysis, retrospective, or old context dressed up with a recent publish date must be rejected: respond {"found": false} rather than present it as current news. For "history" category stories, older, well-documented material is fine, but state the historical period or date being discussed.

DATES: Every article must state, in the body text itself, the specific date, day, or clear timeframe when the described event took place, drawn directly from the source (for example "On Friday, the World Health Organization said..." or "On 17 September, ..."). Never leave a news story without a specific time reference - this is a core requirement for a complete article, not optional detail. If you cannot find such a date in the source, that is itself a sign the story fails the freshness rule above.

COMPLETENESS IS A FACTUAL-ACCURACY REQUIREMENT, NOT A STYLE CHOICE. If the source material you draw from contains serious findings - human rights allegations, casualties, deaths, war crimes findings, criminal conduct, displacement, or other significant harms - connected to the subject of your article, you MUST include them, even if the main angle of the story is something else (such as a territorial gain, an appointment, or an achievement). Omitting documented serious harm while reporting only a neutral or positive framing of the same subject is a factual-completeness failure, not an acceptable editorial choice. When in doubt, include more from the source rather than less.

DO NOT SOFTEN OR GENERALIZE DOCUMENTED FINDINGS. If the source names a specific finding - such as a named report or body reaching a specific conclusion, a specific casualty count, a specific documented incident, or a direct quote describing the severity of something - you must state that specific finding, in specific terms, not replace it with a vague generic sentence like "human rights observers have raised concerns" or "could exacerbate tensions." Name who found what, and what exactly was found, as precisely as the source states it.

If you find a genuine story, write it in BBC News house style: sentence-case headline, tight one-to-two sentence paragraphs, inverted pyramid, attribution close to each claim, British spelling, ending with a Sources section listing the real URLs used. The article must reflect the full picture given in the sources, not just the least controversial part of it.

BEFORE YOU FINALIZE: check your own draft against three things - (1) does the body state a specific date or day for the event, (2) if the source names specific serious findings, does your draft name them specifically rather than vaguely, (3) is the coverImageUrl either a genuinely matching real image or null. If any of these fail, fix the draft before responding, or respond {"found": false} if the story cannot meet these requirements.

IMAGE SELECTION: The system automatically attaches the lead photo of your primary source article, so set primarySourceUrl exactly. Separately, below the search results is a list of real candidate images found alongside them. If, and only if, one of these images clearly and specifically depicts the story you are writing about (matching its description to the subject), select its exact URL as the cover image. Never guess or select an image that is only loosely related, generic, or unrelated (such as a stock photo, an unrelated location, or a different story). If no candidate image clearly matches, set coverImageUrl to null - do not force a mismatched image onto the story.

Respond with ONLY this JSON, no other text, no markdown fences:
{
  "found": true,
  "title": "sentence-case headline",
  "standfirst": "one or two sentence summary",
  "category": "one of: general, culture, history, language, community, diaspora",
  "body": "full HTML body using <p>, <h2>, <h3>, <ul><li> tags, with specific dates stated in the text, ending with a Sources section listing the real URLs",
  "primarySourceUrl": "the exact URL, copied character-for-character from the search results above, of the single main source article this story is based on",
  "coverImageUrl": "fallback only - the exact URL of a clearly matching candidate image, or null if none match",
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
        max_tokens: 2200,
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

    const resolvedImage = parsed.found
      ? await resolveCoverImage(parsed, allResults, allImages)
      : null;

    const debugMode = request.nextUrl.searchParams.get("debug") === "1";
    if (debugMode) {
      return NextResponse.json({
        debug: true,
        searchResultsCount: allResults.length,
        searchResults: allResults,
        promptChars: systemPrompt.length,
        resolvedImage,
        sentToModel: trimmedResults.map((r) => ({ title: r.title, url: r.url, chars: r.snippet.length })),
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
        cover_image_url: resolvedImage?.url ?? null,
        image_credit: resolvedImage?.credit ?? null,
        image_caption: resolvedImage?.caption ?? null,
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
