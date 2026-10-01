cd "$HOME\Downloads\azande-news"

$FilePath = "app\api\cron\weekly-news\route.ts"
$FullPath = (Resolve-Path -LiteralPath $FilePath).Path
$content = [System.IO.File]::ReadAllText($FullPath)

$old = @'
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

  const data = await res.json();

  if (data.error) {
    throw new Error(`Tavily search error: ${data.error}`);
  }

  return (data.results ?? []).map((item: any) => ({
    title: item.title,
    snippet: item.content,
    url: item.url,
  }));
}
'@

$new = @'
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

  return data.results.map((item: any) => ({
    title: item.title,
    snippet: item.content,
    url: item.url,
  }));
}
'@

if ($content.Contains($old)) {
    $updated = $content.Replace($old, $new)
    [System.IO.File]::WriteAllText($FullPath, $updated)
    Write-Host "APPLIED - Tavily errors now surface via HTTP status and raw response, not just a guessed field name" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED - could not find expected text. No changes made." -ForegroundColor Red
}

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Surface real Tavily errors via HTTP status instead of guessing error field shape'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
