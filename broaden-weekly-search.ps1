cd "$HOME\Downloads\azande-news"

$FilePath = "app\api\cron\weekly-news\route.ts"
$FullPath = (Resolve-Path -LiteralPath $FilePath).Path
$content = [System.IO.File]::ReadAllText($FullPath)

# ===== Fix 1: use Tavily's news mode with a recency window, instead of generic search =====
$searchFnOld = @'
async function tavilySearch(query: string): Promise<SearchResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      max_results: 10,
    }),
  });
'@

$searchFnNew = @'
async function tavilySearch(query: string): Promise<SearchResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      topic: "news",
      days: 10,
      max_results: 8,
    }),
  });
'@

if ($content.Contains($searchFnOld)) {
    $content = $content.Replace($searchFnOld, $searchFnNew)
    Write-Host "APPLIED - Switched to Tavily's news-specific search mode with a 10-day recency window" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED (1/3) - search function text not found" -ForegroundColor Red
}

# ===== Fix 2: genuinely cover all three regions plus diaspora, with de-duplication =====
$queriesOld = @'
    // Real search results, not model memory - this is what keeps drafts grounded in fact.
    const queries = [
      "Azande people news",
      "South Sudan Western Equatoria news this week",
      "Yambio news",
    ];
    const allResults: SearchResult[] = [];
    for (const q of queries) {
      const results = await tavilySearch(q);
      allResults.push(...results);
    }

    if (allResults.length === 0) {
      return NextResponse.json({ status: "no-search-results-this-week" });
    }
'@

$queriesNew = @'
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
    for (const q of queries) {
      const results = await tavilySearch(q);
      rawResults.push(...results);
    }

    const seenUrls = new Set<string>();
    const allResults = rawResults.filter((r) => {
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

    if (allResults.length === 0) {
      return NextResponse.json({ status: "no-search-results-this-week" });
    }
'@

if ($content.Contains($queriesOld)) {
    $content = $content.Replace($queriesOld, $queriesNew)
    Write-Host "APPLIED - Search now covers South Sudan, DR Congo, Central African Republic, and the diaspora, with duplicate results removed" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED (2/3) - queries text not found" -ForegroundColor Red
}

[System.IO.File]::WriteAllText($FullPath, $content)

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Broaden weekly news search to all three Azande regions plus diaspora; use news-specific search mode'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
