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

# ===== 1. More Azande-area place names (DR Congo and Central African Republic) =====
$pTermsNew = @'
"dungu", "isiro", "obo", "zemio", "rafai", "rafaï",
  "maridi", "mvolo", "niangara", "rungu", "ango", "bondo", "bambesa", "poko", "wamba",
  "faradje", "watsa", "haut-mbomou", "mbomou", "bambouti", "djema", "mboki", "bangassou",
'@
Apply-Patch -Path $route `
    -Old '"dungu", "isiro", "obo", "zemio", "rafai", "rafaï",' `
    -New $pTermsNew `
    -Marker '"bambouti"' `
    -Label "Added more Azande-area place names"

# ===== 2. Helpers: require a regional term, and drop clearly stale results =====
$pHelpersNew = @'
function hasRegionTerm(r: SearchResult): boolean {
  const text = `${r.title} ${r.snippet ?? ""}`.toLowerCase();
  return RELEVANCE_TERMS.some((term) => new RegExp(`(^|[^a-zé])${term}([^a-zé]|$)`).test(text));
}

// Drops results whose own published date (when the search supplies one) is clearly too old.
function isStale(r: SearchResult, maxDays: number): boolean {
  if (!r.published) return false;
  const t = Date.parse(r.published);
  if (Number.isNaN(t)) return false;
  return Date.now() - t > maxDays * 24 * 60 * 60 * 1000;
}

function isOwnSite(url: string): boolean {
'@
Apply-Patch -Path $route `
    -Old 'function isOwnSite(url: string): boolean {' `
    -New $pHelpersNew `
    -Marker 'function hasRegionTerm' `
    -Label "Added regional-term and stale-date helpers"

Apply-Patch -Path $route `
    -Old '&& !isOwnSite(r.url))' `
    -New '&& !isOwnSite(r.url) && hasRegionTerm(r) && !isStale(r, 14))' `
    -Marker '&& hasRegionTerm(r)' `
    -Label "Sources must mention an Azande-area place, and stale ones are dropped"

# ===== 3. Photos: no generic fallback photo on news stories, plus a probe to learn why the source photo failed =====
$pProbeNew = @'
// Debug only: explains why a source article's own photo could or could not be found.
async function probeOgImage(pageUrl: string, results: SearchResult[]) {
  if (!pageUrl.startsWith("https://") || !results.some((r) => r.url === pageUrl)) {
    return { note: "source URL was not one of the search results" };
  }
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
      const html = res.ok ? (await res.text()).slice(0, 300000) : "";
      return {
        httpStatus: res.status,
        htmlLength: html.length,
        ogImage: html ? getMetaContent(html, ["og:image", "og:image:url", "twitter:image"]) : null,
      };
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return { note: "request failed or timed out" };
  }
}

async function resolveCoverImage(
'@
Apply-Patch -Path $route `
    -Old 'async function resolveCoverImage(' `
    -New $pProbeNew `
    -Marker 'async function probeOgImage' `
    -Label "Added a photo-lookup probe for debug mode"

Apply-Patch -Path $route `
    -Old 'if (chosen) {' `
    -New 'if (chosen && ["history", "culture", "language"].includes(String(parsed.category))) {' `
    -Marker '["history", "culture", "language"].includes(String(parsed.category))' `
    -Label "Generic candidate photos are only allowed on history, culture and language stories, never hard news"

$pOgDebugNew = @'
resolvedImage,
        ogProbe:
          parsed.found && typeof parsed.primarySourceUrl === "string"
            ? await probeOgImage(parsed.primarySourceUrl, allResults)
            : null,
'@
Apply-Patch -Path $route `
    -Old 'resolvedImage,' `
    -New $pOgDebugNew `
    -Marker 'ogProbe:' `
    -Label "Debug output explains the photo lookup"

Apply-Patch -Path $route `
    -Old 'url: r.url, chars: r.snippet.length }' `
    -New 'url: r.url, published: r.published, chars: r.snippet.length }' `
    -Marker 'published: r.published, chars' `
    -Label "Debug output shows each source's published date"

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push BOTH commits together:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Require regional sources, drop stale results, no generic photos on news, add photo probe'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
