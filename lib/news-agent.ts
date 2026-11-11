import { NextRequest, NextResponse } from "next/server";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/* ============================================================================
   Azande News: daily news agent

   Every day one job drafts ONE article (the section changes by weekday) and a
   second job drafts ONE regional briefing (South Sudan, DR Congo, Central
   African Republic). Everything is saved as a PENDING draft. Nothing is
   published until an admin clicks "Publish now".
   ========================================================================== */

export type SearchResult = {
  title: string;
  snippet: string;
  url: string;
  query?: string;
  published?: string;
};

type ResolvedImage = { url: string; credit: string | null; caption: string | null };

type SectionKey = "local" | "community" | "culture" | "diaspora" | "history" | "language";

type Section = {
  key: SectionKey;
  label: string;
  category: string;
  topic: "news" | "general";
  fresh: boolean;
  queries: string[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const BOT_UA = "Mozilla/5.0 (compatible; AzandeNewsBot/1.0; +https://azande-news.vercel.app)";

/* ---------------------------------------------------------------- sections */

const SECTIONS: Record<SectionKey, Section> = {
  local: {
    key: "local",
    label: "Local news",
    category: "general",
    topic: "news",
    fresh: true,
    queries: [
      "Yambio Western Equatoria",
      "Western Equatoria State South Sudan",
      "Tambura Ezo Nzara Ibba Mundri Maridi",
      "Dungu Isiro Haut-Uele",
      "Obo Zemio Haut-Mbomou Central African Republic",
    ],
  },
  community: {
    key: "community",
    label: "Community",
    category: "community",
    topic: "news",
    fresh: true,
    queries: [
      "Azande community",
      "Zande kingdom Gbudwe",
      "Western Equatoria youth women community peace",
      "Azande association",
    ],
  },
  culture: {
    key: "culture",
    label: "Culture",
    category: "culture",
    topic: "news",
    fresh: true,
    queries: ["Azande culture", "Zande festival", "Azande music dance heritage", "Western Equatoria culture"],
  },
  diaspora: {
    key: "diaspora",
    label: "Diaspora",
    category: "diaspora",
    topic: "news",
    fresh: true,
    queries: ["Azande diaspora", "Azande community association abroad", "South Sudanese diaspora Zande"],
  },
  history: {
    key: "history",
    label: "History",
    category: "history",
    topic: "general",
    fresh: false,
    queries: ["Azande history", "Zande kingdom history Gbudwe Yambio", "Azande people origins"],
  },
  language: {
    key: "language",
    label: "Language",
    category: "language",
    topic: "general",
    fresh: false,
    queries: ["Zande language Pazande", "Azande language", "Zande language preservation"],
  },
};

function pickSection(override: string | null, now: Date): Section {
  if (override && Object.prototype.hasOwnProperty.call(SECTIONS, override)) {
    return SECTIONS[override as SectionKey];
  }
  const week = Math.floor(now.getTime() / (7 * DAY_MS));
  const byWeekday: SectionKey[] = [
    week % 2 === 0 ? "history" : "language", // Sunday
    "local", // Monday
    "community", // Tuesday
    "culture", // Wednesday
    "local", // Thursday
    "diaspora", // Friday
    "local", // Saturday
  ];
  return SECTIONS[byWeekday[now.getUTCDay()]];
}

const BRIEFING_QUERIES = [
  "South Sudan news",
  "South Sudan politics election",
  "South Sudan security conflict",
  "Democratic Republic of Congo news",
  "DR Congo Haut-Uele Ituri Bas-Uele",
  "Central African Republic news",
  "Central African Republic Haut-Mbomou",
];

const COUNTRIES = ["South Sudan", "DR Congo", "Central African Republic"];

const REGION_TERMS = [
  "azande", "azandé", "zande", "yambio", "western equatoria", "tombura", "tambura",
  "mundri", "ibba", "nzara", "ezo", "haut-uele", "haut-uélé", "bas-uele", "bas-uélé",
  "dungu", "isiro", "obo", "zemio", "rafai", "rafaï", "maridi", "mvolo", "niangara",
  "rungu", "ango", "bondo", "bambesa", "poko", "wamba", "faradje", "watsa",
  "haut-mbomou", "mbomou", "bambouti", "djema", "mboki", "bangassou",
];

const COUNTRY_TERMS = [
  "south sudan", "juba", "equatoria", "bahr el ghazal", "upper nile", "jonglei", "unity state",
  "warrap", "unmiss", "spla",
  "congo", "drc", "kinshasa", "kivu", "ituri", "uele", "uélé", "tshopo", "goma", "bunia",
  "central african republic", "bangui", "minusca", "mbomou",
];

/* ----------------------------------------------------------- small helpers */

function jsonResponse(body: unknown, status: number): Response {
  return NextResponse.json(body, { status });
}

function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function checkAuth(request: NextRequest): Response | null {
  const secret = process.env.CRON_SECRET;
  if (!secret) return jsonResponse({ error: "CRON_SECRET is not set on the server" }, 500);
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  return null;
}

function adminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/* ------------------------------------------------------ source filtering */

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

const SOCIAL_HOSTS = ["facebook.com", "instagram.com", "tiktok.com", "youtube.com", "youtu.be", "twitter.com", "x.com"];

const MONTH_NAMES = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];
const WEEKDAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

const DATE_SIGNAL = new RegExp(
  `\\b(?:${MONTH_NAMES.join("|")})\\s+\\d{1,2}\\b|\\b\\d{1,2}\\s+(?:${MONTH_NAMES.join("|")})\\b|\\b(?:${WEEKDAY_NAMES.join("|")})\\b`,
  "i"
);

function termRegex(term: string): RegExp {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-zé])${escaped}([^a-zé]|$)`);
}

function isSocialHost(url: string): boolean {
  const host = hostOf(url).toLowerCase();
  return SOCIAL_HOSTS.some((h) => host === h || host.endsWith("." + h));
}

function isOwnSite(url: string): boolean {
  return hostOf(url).endsWith("azande-news.vercel.app");
}

function isStale(r: SearchResult, maxDays: number): boolean {
  if (!r.published) return false;
  const t = Date.parse(r.published);
  if (Number.isNaN(t)) return false;
  return Date.now() - t > maxDays * DAY_MS;
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

type SelectOptions = {
  excludeUrls: Set<string>;
  terms: string[];
  maxAgeDays?: number;
  charBudget: number;
  snippetMax: number;
};

// Keeps only relevant, recent, non-duplicate, non-social sources; takes the best
// result from each search in turn so one big story cannot crowd out the rest.
function selectSources(results: SearchResult[], opts: SelectOptions): SearchResult[] {
  const regexes = opts.terms.map(termRegex);
  const textOf = (r: SearchResult) => `${r.title} ${r.snippet ?? ""}`.toLowerCase();
  const seenUrls = new Set<string>();

  const ranked = results
    .filter((r) => {
      if (!r.url || !r.title || seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      if (opts.excludeUrls.has(r.url)) return false;
      if (JUNK_TITLE_PATTERNS.some((p) => p.test(r.title))) return false;
      if (isSocialHost(r.url) || isOwnSite(r.url)) return false;
      if (opts.maxAgeDays !== undefined && isStale(r, opts.maxAgeDays)) return false;
      const text = textOf(r);
      return regexes.some((re) => re.test(text));
    })
    .map((r, index) => {
      const text = textOf(r);
      const score = regexes.filter((re) => re.test(text)).length + (DATE_SIGNAL.test(text) ? 2 : 0);
      return { r, index, score };
    })
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const byQuery = new Map<string, SearchResult[]>();
  ranked.forEach(({ r }) => {
    const key = r.query ?? "other";
    const list = byQuery.get(key) ?? [];
    list.push(r);
    byQuery.set(key, list);
  });
  const queryLists = Array.from(byQuery.values());
  const longest = queryLists.reduce((m, l) => Math.max(m, l.length), 0);
  const interleaved: SearchResult[] = [];
  for (let i = 0; i < longest; i++) {
    queryLists.forEach((list) => {
      if (list[i]) interleaved.push(list[i]);
    });
  }

  const chosen: SearchResult[] = [];
  const keptTokens: Set<string>[] = [];
  let used = 0;
  interleaved.forEach((r) => {
    const tokens = titleTokens(r.title);
    if (keptTokens.some((k) => titleSimilarity(tokens, k) >= 0.4)) return;
    const raw = r.snippet ?? "";
    const snippet = raw.length > opts.snippetMax ? raw.slice(0, opts.snippetMax) + "..." : raw;
    const cost = r.title.length + snippet.length + r.url.length + 24;
    if (used + cost > opts.charBudget) return;
    chosen.push({ ...r, snippet });
    keptTokens.push(tokens);
    used += cost;
  });
  return chosen;
}

function formatSources(sources: SearchResult[]): string {
  return sources
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}${r.published ? `\nPublished: ${r.published}` : ""}`
    )
    .join("\n\n");
}

/* ------------------------------------------------------------------ search */

async function tavilySearch(
  query: string,
  topic: "news" | "general",
  days: number | undefined,
  maxResults: number
): Promise<SearchResult[]> {
  const body: Record<string, unknown> = {
    api_key: process.env.TAVILY_API_KEY,
    query,
    topic,
    max_results: maxResults,
  };
  if (topic === "news" && days) body.days = days;

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`Tavily HTTP ${res.status}: ${raw.slice(0, 300)}`);

  const data = JSON.parse(raw);
  if (!Array.isArray(data.results)) throw new Error(`Tavily returned an unexpected shape: ${raw.slice(0, 300)}`);

  return data.results.map((item: any) => ({
    title: String(item.title ?? ""),
    snippet: String(item.content ?? ""),
    url: String(item.url ?? ""),
    published: item.published_date ?? item.publishedDate ?? undefined,
  }));
}

async function gatherResults(
  queries: string[],
  topic: "news" | "general",
  days: number | undefined,
  maxResults: number,
  warnings: string[]
): Promise<SearchResult[]> {
  const settled = await Promise.all(
    queries.map(async (q) => {
      try {
        return { q, results: await tavilySearch(q, topic, days, maxResults), error: "" };
      } catch (e) {
        return { q, results: [] as SearchResult[], error: errorMessage(e) };
      }
    })
  );

  const all: SearchResult[] = [];
  let failures = 0;
  settled.forEach((s) => {
    if (s.error) {
      failures += 1;
      warnings.push(`Search failed for "${s.q}": ${s.error.slice(0, 200)}`);
    }
    s.results.forEach((r) => all.push({ ...r, query: s.q }));
  });
  if (failures === queries.length) throw new Error(`All searches failed. First error: ${warnings[0] ?? "unknown"}`);
  return all;
}

/* -------------------------------------------------------------------- Groq */

async function callGroq(system: string, user: string, maxTokens: number): Promise<{ data: any; model: string }> {
  const models = Array.from(
    new Set([process.env.GROQ_MODEL, "openai/gpt-oss-120b", "openai/gpt-oss-20b"].filter((m): m is string => !!m))
  );
  let lastError = "";

  for (const model of models) {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: maxTokens,
      }),
    });
    const raw = await res.text();

    if (!res.ok) {
      lastError = `Groq ${model} HTTP ${res.status}: ${raw.slice(0, 400)}`;
      // A retired model, an over-size request or a rate limit: try the next model.
      if (res.status === 404 || res.status === 413 || res.status === 429 || res.status >= 500) continue;
      throw new Error(lastError);
    }

    const payload = JSON.parse(raw);
    const content: unknown = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || !content.trim()) {
      lastError = `Groq ${model} returned no content (finish reason: ${payload?.choices?.[0]?.finish_reason ?? "unknown"})`;
      continue;
    }
    const cleaned = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
    try {
      return { data: JSON.parse(cleaned), model };
    } catch {
      lastError = `Groq ${model} returned text that is not valid JSON: ${cleaned.slice(0, 200)}`;
    }
  }
  throw new Error(lastError || "Groq failed");
}

/* ------------------------------------------------- HTML safety and checks */

const ALLOWED_TAGS = ["p", "h2", "h3", "ul", "ol", "li", "strong", "em", "a", "blockquote", "br"];

// Keeps only a small set of safe tags and strips every attribute except https links.
function sanitizeHtml(html: string): string {
  const withoutDangerous = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed)\b[\s\S]*?<\/\1>/gi, "");

  return withoutDangerous.replace(/<\/?([a-z][a-z0-9]*)\b([^>]*)>/gi, (full: string, name: string, attrs: string) => {
    const tag = name.toLowerCase();
    if (ALLOWED_TAGS.indexOf(tag) === -1) return "";
    if (full.charAt(1) === "/") return `</${tag}>`;
    if (tag === "a") {
      const m = attrs.match(/href\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      const href = ((m && (m[1] ?? m[2])) || "").trim();
      if (/^https:\/\//i.test(href)) return `<a href="${href.replace(/"/g, "&quot;")}" rel="noopener noreferrer">`;
      return "<a>";
    }
    return `<${tag}>`;
  });
}

function matches(text: string, re: RegExp): string[] {
  const found = text.match(re);
  return found ? Array.from(found) : [];
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function contentStems(text: string): string[] {
  return matches(text.toLowerCase(), /[a-zà-ÿ0-9]{5,}/g).map((w) => w.slice(0, 5));
}

function numbersIn(text: string): string[] {
  return matches(text, /\d[\d,]*\d|\d/g).map((n) => n.replace(/,/g, ""));
}

// Lists sentences whose wording or numbers do not appear in the cited sources.
function findUnsupportedSentences(html: string, sourceText: string): string[] {
  const sourceStems = new Set(contentStems(sourceText));
  const sourceNumbers = new Set(numbersIn(sourceText));
  const sentences = matches(stripTags(html), /[^.!?]+[.!?]+/g);
  const flagged: string[] = [];
  sentences.forEach((raw) => {
    const sentence = raw.trim();
    // Any number that the sources never mention is flagged, however short the sentence.
    const missingNumber = numbersIn(sentence).some((n) => !sourceNumbers.has(n));
    if (missingNumber && sentence.length >= 20) {
      flagged.push(sentence);
      return;
    }
    const stems = contentStems(sentence);
    if (sentence.length < 40 || stems.length < 5) return;
    const supported = stems.filter((s) => sourceStems.has(s)).length;
    if (supported / stems.length < 0.6) flagged.push(sentence);
  });
  return flagged;
}

// Finds "Wednesday 15 October 2026" style dates where the weekday and date disagree.
function checkWeekdayDates(text: string, now: Date): string[] {
  const issues: string[] = [];
  const re = new RegExp(
    `\\b(${WEEKDAY_NAMES.join("|")})\\s+(?:the\\s+)?(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_NAMES.join("|")})(?:\\s+(\\d{4}))?`,
    "gi"
  );
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const weekday = WEEKDAY_NAMES.indexOf(m[1].toLowerCase());
    const day = parseInt(m[2], 10);
    const month = MONTH_NAMES.indexOf(m[3].toLowerCase());
    const year = m[4] ? parseInt(m[4], 10) : now.getUTCFullYear();
    const actual = new Date(Date.UTC(year, month, day)).getUTCDay();
    if (actual !== weekday) {
      issues.push(`"${m[0]}" does not match the calendar (${day} ${m[3]} ${year} is a ${WEEKDAY_NAMES[actual]})`);
    }
  }
  return issues;
}

/* -------------------------------------------------------- cover photo lookup */

function decodeEntities(s: string): string {
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

function getMetaContent(html: string, keys: string[]): string | null {
  const tags = matches(html, /<meta\b[^>]*>/gi);
  for (const wanted of keys) {
    for (const tag of tags) {
      const key = (getAttr(tag, "property") ?? getAttr(tag, "name") ?? "").toLowerCase();
      if (key !== wanted) continue;
      const content = getAttr(tag, "content");
      if (content && content.trim()) return decodeEntities(content.trim());
    }
  }
  return null;
}

// The photo the publisher attached to this exact article (its og:image).
async function fetchLeadImage(pageUrl: string): Promise<ResolvedImage | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(pageUrl, {
        headers: { "User-Agent": BOT_UA, Accept: "text/html" },
        signal: controller.signal,
        redirect: "follow",
      });
      if (!res.ok) return null;
      const html = (await res.text()).slice(0, 300000);
      const raw = getMetaContent(html, ["og:image", "og:image:url", "twitter:image"]);
      if (!raw) return null;
      const absolute = new URL(raw, pageUrl);
      if (absolute.protocol !== "https:") return null;
      if (/logo|favicon|placeholder|sprite/i.test(absolute.toString())) return null;
      const site = getMetaContent(html, ["og:site_name"]);
      const alt = getMetaContent(html, ["og:image:alt", "twitter:image:alt"]);
      return { url: absolute.toString(), credit: site ?? hostOf(pageUrl), caption: alt };
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------------- database */

async function getRecentSourceUrls(db: SupabaseClient, warnings: string[]): Promise<Set<string>> {
  const urls = new Set<string>();
  try {
    const since = new Date(Date.now() - 60 * DAY_MS).toISOString();
    const { data, error } = await db
      .from("news_runs")
      .select("source_url")
      .not("source_url", "is", null)
      .gte("created_at", since)
      .limit(2000);
    if (error) throw new Error(error.message);
    (data ?? []).forEach((row: { source_url: string | null }) => {
      if (row.source_url) urls.add(row.source_url);
    });
  } catch (e) {
    warnings.push(`Duplicate protection is OFF (could not read the news_runs table): ${errorMessage(e)}`);
  }
  return urls;
}

type RunRow = {
  job: string;
  section?: string | null;
  status: string;
  source_url?: string | null;
  post_id?: string | null;
  message?: string | null;
  details?: unknown;
};

async function logRun(db: SupabaseClient, row: RunRow, warnings: string[]): Promise<void> {
  try {
    const { error } = await db.from("news_runs").insert(row);
    if (error) throw new Error(error.message);
  } catch (e) {
    warnings.push(`Could not write the run log: ${errorMessage(e)}`);
  }
}

async function findAdminId(db: SupabaseClient): Promise<string> {
  const { data, error } = await db.from("profiles").select("id").eq("role", "admin").limit(1);
  if (error) throw new Error(`Could not look up an admin profile: ${error.message}`);
  const id = data && data[0] ? (data[0] as { id: string }).id : "";
  if (!id) throw new Error("No admin profile found to use as the draft author");
  return id;
}

type DraftFields = {
  title: string;
  standfirst: string | null;
  body: string;
  category: string;
  author_id: string;
  cover_image_url: string | null;
  image_credit: string | null;
  image_caption: string | null;
  ai_flag_reason: string;
};

async function insertDraft(db: SupabaseClient, f: DraftFields): Promise<string> {
  const { data, error } = await db
    .from("posts")
    .insert({ ...f, status: "pending", ai_flagged: true })
    .select("id")
    .single();
  if (error || !data) throw new Error(`Saving the draft failed: ${error ? error.message : "no row returned"}`);
  return (data as { id: string }).id;
}

/* --------------------------------------------------------- shared prompt bits */

function promptHeader(now: Date, windowDays: number | null): string {
  const today = formatDate(now);
  const cutoff = windowDays ? formatDate(new Date(now.getTime() - windowDays * DAY_MS)) : null;
  const fresh = cutoff
    ? `A story counts as fresh news only if the event itself happened on or after ${cutoff}. Older material is background and must not be presented as news.`
    : "This is a background piece: older material is fine, but state the period or date being discussed.";
  return (
    `You are the news researcher for Azande News, a free community site for the Azande people of South Sudan, ` +
    `DR Congo and the Central African Republic, and the diaspora.\n\n` +
    `TODAY IS ${today}. ${fresh} Each source may show a Published date; use it together with the dates in the text.\n\n` +
    `SOURCES: use ONLY the search results below. Never add a fact, name, number, date, cause, reaction or background ` +
    `that the results do not state, including general knowledge about places or peoples. Attribute each statement to ` +
    `exactly the person or organisation the source says made it; never move a statement from one body to another. ` +
    `Write in your own words and never copy sentences.\n\n`
  );
}

/* ================================================================ DAILY STORY */

export async function runDailyStory(request: NextRequest): Promise<Response> {
  const denied = checkAuth(request);
  if (denied) return denied;

  const params = request.nextUrl.searchParams;
  const debug = params.get("debug") === "1";
  const now = new Date();
  const section = pickSection(params.get("section"), now);
  const warnings: string[] = [];
  let db: SupabaseClient | null = null;

  try {
    db = adminClient();
    const recent = await getRecentSourceUrls(db, warnings);
    const results = await gatherResults(section.queries, section.topic, section.fresh ? 7 : undefined, 6, warnings);
    const sources = selectSources(results, {
      excludeUrls: recent,
      terms: REGION_TERMS,
      maxAgeDays: section.fresh ? 10 : undefined,
      charBudget: 9000,
      snippetMax: 1500,
    });

    if (sources.length === 0) {
      const message = "No new, relevant sources were found after filtering.";
      if (!debug) await logRun(db, { job: "story", section: section.key, status: "nothing-found", message }, warnings);
      return jsonResponse({ status: "nothing-found", section: section.key, message, warnings }, 200);
    }

    const system =
      promptHeader(now, section.fresh ? 7 : null) +
      `SECTION: ${section.label} (category "${section.category}").\n\n` +
      `CHOOSE ONE specific story clearly relevant to the Azande people or to Western Equatoria, Yambio, Haut-Uele, ` +
      `Bas-Uele, Haut-Mbomou or the diaspora. ` +
      (section.fresh
        ? `It needs a specific date or weekday for the event in the source. `
        : `It must be about ${section.label.toLowerCase()} and well sourced. `) +
      `If nothing qualifies, reply {"found": false, "reason": "<short reason>"}.\n\n` +
      `WRITE in BBC News house style: sentence-case headline; a standfirst of one or two sentences; short paragraphs of ` +
      `one or two sentences, most important facts first; British spelling; state the date or weekday of the event in ` +
      `the text. Keep to what the sources support: a short accurate article beats a padded one. If the sources report ` +
      `deaths, abuses, displacement or other serious harm connected to the subject, include them precisely (who found ` +
      `or said what, numbers as given) and never soften them into vague wording.\n\n` +
      `CHECK before answering: a specific date or weekday is stated; every sentence is traceable to a source; ` +
      `primarySourceUrl is copied exactly from the results. Otherwise fix it, or reply found:false.\n\n` +
      `Reply with ONLY this JSON: {"found": true, "title": "...", "standfirst": "...", ` +
      `"body": "HTML using only p, h2, h3, ul, li; no Sources section", "primarySourceUrl": "..."}\n\n` +
      `SEARCH RESULTS:\n${formatSources(sources)}`;

    const { data: decision, model } = await callGroq(
      system,
      "Draft today's article as instructed, or report that nothing genuine was found.",
      2200
    );

    if (!decision || decision.found !== true || typeof decision.title !== "string" || typeof decision.body !== "string") {
      const message = `Model found nothing suitable${decision && decision.reason ? `: ${String(decision.reason).slice(0, 300)}` : ""}`;
      if (!debug) await logRun(db, { job: "story", section: section.key, status: "nothing-found", message }, warnings);
      return jsonResponse(
        { status: "nothing-found", section: section.key, message, model, warnings, sentToModel: sources.map((s) => s.title) },
        200
      );
    }

    // The primary source must be one of the results we actually supplied.
    const byUrl: Record<string, SearchResult> = {};
    sources.forEach((s) => {
      byUrl[s.url] = s;
    });
    let primaryUrl = typeof decision.primarySourceUrl === "string" ? decision.primarySourceUrl.trim() : "";
    if (!byUrl[primaryUrl]) {
      const cited = sources.find((s) => decision.body.indexOf(s.url) !== -1);
      primaryUrl = cited ? cited.url : "";
    }
    if (!primaryUrl) {
      const message = "The draft did not cite a source that was in the search results, so it was discarded.";
      if (!debug) await logRun(db, { job: "story", section: section.key, status: "nothing-found", message }, warnings);
      return jsonResponse({ status: "nothing-found", section: section.key, message, warnings }, 200);
    }

    // Clean the body, then rebuild the Sources list ourselves.
    const cleaned = sanitizeHtml(decision.body);
    const cut = cleaned.search(/<(?:h[23]|p)>\s*Sources\b/i);
    const main = cut === -1 ? cleaned : cleaned.slice(0, cut);
    const citedSources = sources.filter((s) => s.url === primaryUrl || cleaned.indexOf(s.url) !== -1);
    const sourcesHtml =
      "<h2>Sources</h2><ul>" +
      citedSources
        .map((s) => `<li><a href="${escapeHtml(s.url)}">${escapeHtml(hostOf(s.url))}: ${escapeHtml(s.title)}</a></li>`)
        .join("") +
      "</ul>";
    const body = main + sourcesHtml;

    // Review aids for the admin.
    const groundingText = citedSources.map((s) => `${s.title} ${s.snippet} ${s.url} ${s.published ?? ""}`).join(" ");
    const unsupported = findUnsupportedSentences(main, groundingText);
    const dateIssues = checkWeekdayDates(stripTags(main), now);
    const primary = byUrl[primaryUrl];
    const notes: string[] = [];
    if (section.fresh && primary.published && isStale(primary, 10)) {
      notes.push(
        `The main source was published ${primary.published}, which is more than 10 days ago; confirm this is still news.`
      );
    }
    if (dateIssues.length > 0) notes.push(`Check these dates: ${dateIssues.join("; ")}.`);
    if (unsupported.length > 0) {
      notes.push(
        `Check these sentences against the sources (little overlap with the cited text): ${unsupported
          .map((s) => `"${s}"`)
          .join(" | ")}`
      );
    }

    const image = await fetchLeadImage(primaryUrl);
    if (image) {
      notes.push(
        `Cover image is the publisher's lead photo for the main source (${image.credit ?? "source"}); confirm it fits this story.`
      );
    }

    const flagReason =
      `AI-drafted by the daily ${section.label.toLowerCase()} job from cited web sources. Verify against the sources before publishing. ` +
      notes.join(" ");

    const draft = {
      title: decision.title.trim().slice(0, 200),
      standfirst:
        typeof decision.standfirst === "string" && decision.standfirst.trim()
          ? decision.standfirst.trim().slice(0, 400)
          : null,
      body,
      category: section.category,
      cover_image_url: image ? image.url : null,
      image_credit: image ? image.credit : null,
      image_caption: image ? image.caption : null,
      ai_flag_reason: flagReason.trim(),
    };

    if (debug) {
      return jsonResponse(
        {
          debug: true,
          job: "story",
          section: section.key,
          model,
          promptChars: system.length,
          estimatedPromptTokens: Math.round(system.length / 3.5),
          sentToModel: sources.map((s) => ({
            title: s.title,
            url: s.url,
            published: s.published,
            chars: s.snippet.length,
            query: s.query,
          })),
          warnings,
          notes,
          draft,
          primarySourceUrl: primaryUrl,
        },
        200
      );
    }

    const authorId = await findAdminId(db);
    const postId = await insertDraft(db, { ...draft, author_id: authorId });
    await logRun(
      db,
      {
        job: "story",
        section: section.key,
        status: "drafted",
        source_url: primaryUrl,
        post_id: postId,
        message: draft.title,
        details: { model, notes },
      },
      warnings
    );
    return jsonResponse(
      { status: "draft-created-pending-review", section: section.key, postId, title: draft.title, warnings, notes },
      200
    );
  } catch (e) {
    const message = errorMessage(e);
    if (db && !debug) {
      await logRun(db, { job: "story", section: section.key, status: "error", message: message.slice(0, 800) }, warnings);
    }
    return jsonResponse({ error: message, section: section.key, warnings }, 500);
  }
}

/* ============================================================ DAILY BRIEFING */

type BriefingItem = { country: string; headline: string; summary: string; sourceUrl: string };

export async function runDailyBriefing(request: NextRequest): Promise<Response> {
  const denied = checkAuth(request);
  if (denied) return denied;

  const debug = request.nextUrl.searchParams.get("debug") === "1";
  const now = new Date();
  const warnings: string[] = [];
  let db: SupabaseClient | null = null;

  try {
    db = adminClient();
    const recent = await getRecentSourceUrls(db, warnings);
    const results = await gatherResults(BRIEFING_QUERIES, "news", 3, 5, warnings);
    const sources = selectSources(results, {
      excludeUrls: recent,
      terms: COUNTRY_TERMS.concat(REGION_TERMS),
      maxAgeDays: 5,
      charBudget: 7000,
      snippetMax: 700,
    });

    if (sources.length < 2) {
      const message = "Too few new sources for a briefing after filtering.";
      if (!debug) await logRun(db, { job: "briefing", status: "nothing-found", message }, warnings);
      return jsonResponse({ status: "nothing-found", message, warnings }, 200);
    }

    const system =
      promptHeader(now, 3) +
      `TASK: write today's regional briefing for South Sudan, DR Congo and the Central African Republic. ` +
      `Pick up to 8 distinct, genuinely newsworthy items from the last 3 days, with at least 3 about South Sudan if ` +
      `the sources allow, and prefer items near Western Equatoria, Haut-Uele, Bas-Uele or Haut-Mbomou. ` +
      `Skip any item whose date you cannot establish from the source.\n\n` +
      `Each item: "country" (exactly "South Sudan", "DR Congo" or "Central African Republic"), "headline" (at most 12 words, ` +
      `sentence case), "summary" (one or two sentences, at most 45 words, facts only from that source, include the day or ` +
      `date it happened; if the source reports deaths or abuses, state them precisely), and "sourceUrl" (copied exactly ` +
      `from the results).\n\n` +
      `Reply with ONLY this JSON: {"found": true, "items": [{"country": "...", "headline": "...", "summary": "...", "sourceUrl": "..."}]} ` +
      `or {"found": false, "reason": "..."}.\n\n` +
      `SEARCH RESULTS:\n${formatSources(sources)}`;

    const { data: decision, model } = await callGroq(system, "Write today's briefing as instructed.", 1600);

    const byUrl: Record<string, SearchResult> = {};
    sources.forEach((s) => {
      byUrl[s.url] = s;
    });

    const rawItems: unknown[] = decision && Array.isArray(decision.items) ? decision.items : [];
    const usedUrls: Record<string, boolean> = {};
    const perCountry: Record<string, number> = {};
    const items: BriefingItem[] = [];
    rawItems.forEach((it) => {
      const o = it as Partial<BriefingItem>;
      if (
        !o ||
        typeof o.country !== "string" ||
        typeof o.headline !== "string" ||
        typeof o.summary !== "string" ||
        typeof o.sourceUrl !== "string"
      ) {
        return;
      }
      const url = o.sourceUrl.trim();
      if (!byUrl[url] || usedUrls[url] || COUNTRIES.indexOf(o.country) === -1) return;
      if ((perCountry[o.country] ?? 0) >= 4 || items.length >= 8) return;
      if (!o.headline.trim() || !o.summary.trim()) return;
      usedUrls[url] = true;
      perCountry[o.country] = (perCountry[o.country] ?? 0) + 1;
      items.push({ country: o.country, headline: o.headline.trim(), summary: o.summary.trim(), sourceUrl: url });
    });

    if (!decision || decision.found !== true || items.length < 2) {
      const message = `Briefing not written: ${
        decision && decision.reason ? String(decision.reason).slice(0, 300) : "fewer than 2 valid items"
      }`;
      if (!debug) await logRun(db, { job: "briefing", status: "nothing-found", message }, warnings);
      return jsonResponse({ status: "nothing-found", message, model, warnings }, 200);
    }

    // The server builds the HTML, so model text is escaped and links are only ones we supplied.
    const sections: string[] = [];
    const unsupportedAll: string[] = [];
    const dateIssues: string[] = [];
    COUNTRIES.forEach((country) => {
      const group = items.filter((i) => i.country === country);
      if (group.length === 0) return;
      sections.push(`<h2>${escapeHtml(country)}</h2>`);
      group.forEach((i) => {
        const src = byUrl[i.sourceUrl];
        sections.push(
          `<p><strong>${escapeHtml(i.headline.replace(/[.\s]+$/, ""))}.</strong> ${escapeHtml(i.summary)} ` +
            `<a href="${escapeHtml(i.sourceUrl)}" rel="noopener noreferrer">${escapeHtml(hostOf(i.sourceUrl))}</a></p>`
        );
        const support = `${src.title} ${src.snippet} ${src.url} ${src.published ?? ""}`;
        findUnsupportedSentences(`<p>${i.summary}</p>`, support).forEach((s) =>
          unsupportedAll.push(`${i.headline}: "${s}"`)
        );
        checkWeekdayDates(i.summary, now).forEach((d) => dateIssues.push(d));
      });
    });
    sections.push(
      "<h2>Sources</h2><ul>" +
        items
          .map(
            (i) =>
              `<li><a href="${escapeHtml(i.sourceUrl)}">${escapeHtml(hostOf(i.sourceUrl))}: ${escapeHtml(
                byUrl[i.sourceUrl].title
              )}</a></li>`
          )
          .join("") +
        "</ul>"
    );

    const southSudanCount = items.filter((i) => i.country === "South Sudan").length;
    const notes: string[] = [];
    if (dateIssues.length > 0) notes.push(`Check these dates: ${dateIssues.join("; ")}.`);
    if (unsupportedAll.length > 0) {
      notes.push(`Check these items against their sources (little overlap with the source text): ${unsupportedAll.join(" | ")}`);
    }

    const draft = {
      title: `South Sudan, DR Congo and Central African Republic: briefing for ${formatDate(now).replace(/ \d{4}$/, "")}`,
      standfirst: `${items.length} developments reported in the past three days, ${southSudanCount} of them in South Sudan.`,
      body: sections.join(""),
      category: "general",
      cover_image_url: null as string | null,
      image_credit: null as string | null,
      image_caption: null as string | null,
      ai_flag_reason:
        `AI-drafted by the daily regional briefing job from cited web sources. Verify each item against its source before publishing. ${notes.join(" ")}`.trim(),
    };

    if (debug) {
      return jsonResponse(
        {
          debug: true,
          job: "briefing",
          model,
          promptChars: system.length,
          estimatedPromptTokens: Math.round(system.length / 3.5),
          sentToModel: sources.map((s) => ({
            title: s.title,
            url: s.url,
            published: s.published,
            chars: s.snippet.length,
            query: s.query,
          })),
          warnings,
          notes,
          items,
          draft,
        },
        200
      );
    }

    const authorId = await findAdminId(db);
    const postId = await insertDraft(db, { ...draft, author_id: authorId });
    await logRun(
      db,
      { job: "briefing", status: "drafted", post_id: postId, message: draft.title, details: { model, notes, items: items.length } },
      warnings
    );
    for (const i of items) {
      await logRun(
        db,
        { job: "briefing", status: "briefing-item", source_url: i.sourceUrl, post_id: postId, message: i.headline },
        warnings
      );
    }
    return jsonResponse(
      { status: "draft-created-pending-review", postId, title: draft.title, items: items.length, warnings, notes },
      200
    );
  } catch (e) {
    const message = errorMessage(e);
    if (db && !debug) await logRun(db, { job: "briefing", status: "error", message: message.slice(0, 800) }, warnings);
    return jsonResponse({ error: message, warnings }, 500);
  }
}

/* ===================================================================== LOG */

export async function getRunLog(request: NextRequest): Promise<Response> {
  const denied = checkAuth(request);
  if (denied) return denied;
  try {
    const db = adminClient();
    const { data, error } = await db
      .from("news_runs")
      .select("created_at, job, section, status, message, source_url, post_id")
      .neq("status", "briefing-item")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw new Error(error.message);
    return jsonResponse({ runs: data ?? [] }, 200);
  } catch (e) {
    return jsonResponse({ error: errorMessage(e) }, 500);
  }
}