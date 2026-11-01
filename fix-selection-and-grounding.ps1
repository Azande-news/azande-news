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

# ===== 1. Results can now carry the search they came from and their published date =====
Apply-Patch -Path $route `
    -Old 'type SearchResult = { title: string; snippet: string; url: string };' `
    -New 'type SearchResult = { title: string; snippet: string; url: string; query?: string; published?: string };' `
    -Marker 'query?: string; published?: string' `
    -Label "Search results can carry their search query and published date"

Apply-Patch -Path $route `
    -Old 'url: item.url,' `
    -New "url: item.url,`n    published: item.published_date ?? item.publishedDate ?? undefined," `
    -Marker 'published: item.published_date' `
    -Label "Published date is captured from Tavily when it provides one"

Apply-Patch -Path $route `
    -Old 'rawResults.push(...results);' `
    -New 'rawResults.push(...results.map((r) => ({ ...r, query: q })));' `
    -Marker 'query: q' `
    -Label "Each result remembers which search found it"

$p3New = @'
URL: ${r.url}${r.published ? `\nPublished: ${r.published}` : ""}
'@
Apply-Patch -Path $route `
    -Old 'URL: ${r.url}' `
    -New $p3New.Trim() `
    -Marker 'Published: ${r.published}' `
    -Label "Published date is shown to the model when available"

# ===== 2. Helpers: own-site filter and the grounding check =====
$p4Old = 'function isSocialHost(url: string): boolean {'
$p4New = @'
function isOwnSite(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith("azande-news.vercel.app");
  } catch {
    return false;
  }
}

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function contentStems(text: string): string[] {
  return (text.toLowerCase().match(/[a-zà-ÿ0-9]{5,}/g) ?? []).map((w) => w.slice(0, 5));
}

function numbersIn(text: string): string[] {
  return (text.match(/\d[\d,]*\d|\d/g) ?? []).map((n) => n.replace(/,/g, ""));
}

// Warns the reviewer about sentences whose wording or numbers are not found in the cited sources.
function findUnsupportedSentences(bodyHtml: string, sourceText: string): string[] {
  const sourceStems = new Set(contentStems(sourceText));
  const sourceNumbers = new Set(numbersIn(sourceText));
  const withoutSources = bodyHtml.split(/<h[23][^>]*>\s*Sources/i)[0];
  const sentences = stripTags(withoutSources).match(/[^.!?]+[.!?]+/g) ?? [];
  const flagged: string[] = [];

  for (const raw of sentences) {
    const sentence = raw.trim();
    const stems = contentStems(sentence);
    if (sentence.length < 40 || stems.length < 5) continue;

    const supported = stems.filter((s) => sourceStems.has(s)).length;
    const missingNumber = numbersIn(sentence).some((n) => !sourceNumbers.has(n));
    if (supported / stems.length < 0.6 || missingNumber) flagged.push(sentence);
  }
  return flagged;
}

function isSocialHost(url: string): boolean {
'@
Apply-Patch -Path $route -Old $p4Old -New $p4New -Marker 'function isOwnSite' -Label "Added own-site filter and grounding check helpers"

# ===== 3. Source selection: skip our own site, and take the best result from each search in turn =====
Apply-Patch -Path $route `
    -Old '!isSocialHost(r.url))' `
    -New '!isSocialHost(r.url) && !isOwnSite(r.url))' `
    -Marker '!isOwnSite(r.url)' `
    -Label "The site's own pages are no longer used as sources"

$p6New = @'
// Take the best result from each search in turn, so one big story cannot crowd out the rest.
    const byQuery = new Map<string, SearchResult[]>();
    for (const { r } of ranked) {
      const key = r.query ?? "other";
      const list = byQuery.get(key) ?? [];
      list.push(r);
      byQuery.set(key, list);
    }
    const queryLists = Array.from(byQuery.values());
    const longest = queryLists.reduce((m, l) => Math.max(m, l.length), 0);
    const interleaved: SearchResult[] = [];
    for (let i = 0; i < longest; i++) {
      for (const list of queryLists) {
        if (list[i]) interleaved.push(list[i]);
      }
    }

    for (const r of interleaved) {
'@
Apply-Patch -Path $route -Old 'for (const { r } of ranked) {' -New $p6New -Marker 'const interleaved' -Label "Sources are now spread across searches instead of one story dominating"

# ===== 4. Tell the model today's date =====
$p7New = @'
const fmtDate = (d: Date) =>
      d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
    const todayText = fmtDate(new Date());
    const cutoffText = fmtDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000));

    const systemPrompt = `
'@
Apply-Patch -Path $route -Old 'const systemPrompt = `' -New $p7New -Marker 'const todayText' -Label "Today's date and the freshness cut-off are now calculated"

$p8New = @'
TODAY'S DATE IS ${todayText}. A story counts as fresh news only if the event itself happened on or after ${cutoffText}. Anything older is background and must not be presented as current news (the history category is the only exception). Each search result below may show a Published date; use it, together with the dates stated in the text, to judge freshness.

Below are REAL web search results from this week.
'@
Apply-Patch -Path $route -Old 'Below are REAL web search results from this week.' -New $p8New -Marker "TODAY'S DATE IS" -Label "Prompt now states today's date and the freshness cut-off"

# ===== 5. Attribution and background rules =====
$p9Old = 'A short, fully accurate article is always better than a longer one containing invented plausible-sounding material.'
$p9New = @'
A short, fully accurate article is always better than a longer one containing invented plausible-sounding material. Attribute every statement to exactly the person or organisation the source says made it - never move a statement from one body to another (for example, do not credit a national agency's warning to an international organisation). Do not add general background knowledge (what a town or region is known for, who lives there, why a topic is "relevant to local communities") unless it appears in the source text; if the source does not state a link to the Azande people or their regions, say only what the source states.
'@
Apply-Patch -Path $route -Old $p9Old -New $p9New -Marker 'Attribute every statement to exactly' -Label "Added attribution and no-background-knowledge rules"

# ===== 6. Grounding check for the reviewer, and an honest note about the cover image =====
$p10New = @'
const citedTexts = trimmedResults
      .filter(
        (r) =>
          (typeof parsed.body === "string" && parsed.body.includes(r.url)) ||
          r.url === parsed.primarySourceUrl
      )
      .map((r) => `${r.title} ${r.snippet} ${r.url}`);
    const groundingText = (
      citedTexts.length > 0 ? citedTexts : trimmedResults.map((r) => `${r.title} ${r.snippet} ${r.url}`)
    ).join(" ");
    const unsupportedSentences: string[] =
      parsed.found && typeof parsed.body === "string"
        ? findUnsupportedSentences(parsed.body, groundingText)
        : [];

    const resolvedImage = parsed.found
'@
Apply-Patch -Path $route -Old 'const resolvedImage = parsed.found' -New $p10New -Marker 'const unsupportedSentences' -Label "Draft is checked against its cited sources"

Apply-Patch -Path $route `
    -Old 'promptChars: systemPrompt.length,' `
    -New "promptChars: systemPrompt.length,`n        unsupportedSentences," `
    -Marker 'unsupportedSentences,' `
    -Label "Debug output lists sentences to verify"

$p12Old = 'ai_flag_reason: "AI-drafted from real web search results. Review the sources listed in the article before publishing.",'
$p12New = @'
ai_flag_reason:
          "AI-drafted from real web search results. Review the sources listed in the article before publishing." +
          (resolvedImage
            ? ` Cover image is the publisher's lead photo for the source article (${resolvedImage.credit ?? "source"}); confirm it fits this story.`
            : "") +
          (unsupportedSentences.length > 0
            ? ` Check these sentences against the sources (little overlap with the cited text): ${unsupportedSentences
                .map((s) => `"${s}"`)
                .join(" | ")}`
            : ""),
'@
Apply-Patch -Path $route -Old $p12Old -New $p12New -Marker 'Check these sentences against the sources' -Label "Admin sees which sentences to verify and a note about the cover image"

# ===== 7. The RSS footer link that never got applied =====
Apply-Patch -Path "components\Footer.tsx" `
    -Old '>Editorial guidelines</Link>' `
    -New ">Editorial guidelines</Link>`n          <a href=`"/feed.xml`" className=`"hover:text-white transition-colors`">RSS feed</a>" `
    -Marker '/feed.xml' `
    -Label "RSS feed link added to the footer"

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Spread sources across searches, skip own site, give model today's date, add grounding check, add RSS link'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
