cd "$HOME\Downloads\azande-news"

function Normalize-LF([string]$s) { return ($s -replace "`r`n", "`n") }

function Apply-Patch {
    param(
        [string]$Path,
        [string]$Old,
        [string]$New,
        [string]$Marker,
        [string]$Label
    )

    $full = (Resolve-Path -LiteralPath $Path).Path
    $raw = [System.IO.File]::ReadAllText($full)
    $crlf = $raw.Contains("`r`n")
    $work = Normalize-LF $raw

    if ($work.Contains((Normalize-LF $Marker))) {
        Write-Host "ALREADY APPLIED - $Label" -ForegroundColor Yellow
        return
    }

    $o = Normalize-LF $Old
    $n = Normalize-LF $New
    $idx = $work.IndexOf($o, [System.StringComparison]::Ordinal)

    if ($idx -lt 0) {
        Write-Host "NOT APPLIED - $Label (expected text not found; no change made)" -ForegroundColor Red
        return
    }

    $work = $work.Substring(0, $idx) + $n + $work.Substring($idx + $o.Length)
    if ($crlf) { $work = $work -replace "`n", "`r`n" }
    [System.IO.File]::WriteAllText($full, $work)
    Write-Host "APPLIED - $Label" -ForegroundColor Green
}

$route = "app\api\cron\weekly-news\route.ts"

# ===== 1. Helper functions: source ranking, de-duplication, and real lead-image lookup =====
$p1Old = @'
type ImageCandidate = { url: string; description: string };
'@

$p1New = @'
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
'@

Apply-Patch -Path $route -Old $p1Old -New $p1New -Marker 'async function fetchOgImage' -Label "Added source ranking, de-duplication and lead-image lookup helpers"

# ===== 2. Choose sources by relevance and fit them inside a fixed size budget =====
$p2Old = @'
    const trimmedResults = allResults.slice(0, 30).map((r) => ({
      ...r,
      snippet: r.snippet.length > 1500 ? r.snippet.slice(0, 1500) + "..." : r.snippet,
    }));
'@

$p2New = @'
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
'@

Apply-Patch -Path $route -Old $p2Old -New $p2New -Marker 'RESULTS_CHAR_BUDGET' -Label "Sources are now ranked, de-duplicated and fitted to the Groq free-tier token limit"

# ===== 3. Fewer image candidates, smaller output cap (together these keep the request under 8,000 tokens) =====
Apply-Patch -Path $route -Old '.slice(0, 15);' -New '.slice(0, 6);' -Marker '.slice(0, 6);' -Label "Image candidates reduced to 6"
Apply-Patch -Path $route -Old 'max_tokens: 3000,' -New 'max_tokens: 2200,' -Marker 'max_tokens: 2200,' -Label "Output cap set to 2200 tokens"

# ===== 4. Ask the model which article the story is based on =====
$p5Old = '"coverImageUrl": "the exact URL of a clearly matching candidate image, or null if none match",'
$p5New = @'
"primarySourceUrl": "the exact URL, copied character-for-character from the search results above, of the single main source article this story is based on",
  "coverImageUrl": "fallback only - the exact URL of a clearly matching candidate image, or null if none match",
'@
Apply-Patch -Path $route -Old $p5Old -New $p5New.TrimEnd() -Marker '"primarySourceUrl"' -Label "Model now reports the primary source article"

Apply-Patch -Path $route `
    -Old 'IMAGE SELECTION: Below the search results is a list' `
    -New 'IMAGE SELECTION: The system automatically attaches the lead photo of your primary source article, so set primarySourceUrl exactly. Separately, below the search results is a list' `
    -Marker 'automatically attaches the lead photo' `
    -Label "Prompt explains the lead-photo behaviour"

# ===== 5. Resolve the image after the model answers, and use it when saving =====
$p7Old = 'const parsed = JSON.parse(text);'
$p7New = @'
const parsed = JSON.parse(text);

    const resolvedImage = parsed.found
      ? await resolveCoverImage(parsed, allResults, allImages)
      : null;
'@
Apply-Patch -Path $route -Old $p7Old -New $p7New.TrimEnd() -Marker 'const resolvedImage' -Label "Cover image is now resolved from the real source article"

$p8Old = 'imageCandidatesCount: allImages.length,'
$p8New = @'
promptChars: systemPrompt.length,
        resolvedImage,
        sentToModel: trimmedResults.map((r) => ({ title: r.title, url: r.url, chars: r.snippet.length })),
        imageCandidatesCount: allImages.length,
'@
Apply-Patch -Path $route -Old $p8Old -New $p8New.TrimEnd() -Marker 'promptChars' -Label "Debug output now shows prompt size, what the model saw, and the resolved image"

Apply-Patch -Path $route -Old 'cover_image_url: parsed.coverImageUrl || null,' -New 'cover_image_url: resolvedImage?.url ?? null,' -Marker 'resolvedImage?.url' -Label "Saved cover image uses the resolved image"
Apply-Patch -Path $route -Old 'image_credit: parsed.coverImageCredit || null,' -New 'image_credit: resolvedImage?.credit ?? null,' -Marker 'resolvedImage?.credit' -Label "Saved image credit uses the resolved image"
Apply-Patch -Path $route -Old 'image_caption: parsed.coverImageCaption || null,' -New 'image_caption: resolvedImage?.caption ?? null,' -Marker 'resolvedImage?.caption' -Label "Saved image caption uses the resolved image"

# ===== 6. Let external images display (single-line match, independent of line endings) =====
$cfgFull = (Resolve-Path -LiteralPath "next.config.mjs").Path
$cfgRaw = [System.IO.File]::ReadAllText($cfgFull)

if ($cfgRaw -match 'hostname:\s*"\*\*"') {
    Write-Host "ALREADY APPLIED - next.config.mjs already allows any https image host" -ForegroundColor Yellow
}
elseif ($cfgRaw -match 'hostname:\s*"\*\.supabase\.co"') {
    $cfgNew = [regex]::Replace($cfgRaw, 'hostname:\s*"\*\.supabase\.co"', 'hostname: "**"')
    [System.IO.File]::WriteAllText($cfgFull, $cfgNew)
    Write-Host "APPLIED - next.config.mjs now allows images from any https host (this was the step that silently failed before)" -ForegroundColor Green
}
else {
    Write-Host "NOT APPLIED - could not find the image host setting in next.config.mjs. Paste the file here and I will fix it." -ForegroundColor Red
}

Write-Host ""
Write-Host "Current image-related settings in next.config.mjs:" -ForegroundColor Cyan
Select-String -Path $cfgFull -Pattern 'hostname|img-src' | ForEach-Object { Write-Host ("  " + $_.Line.Trim()) -ForegroundColor DarkGray }

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Fit Groq request under free-tier limit; rank sources; use real lead photo of source article; allow external image hosts'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
