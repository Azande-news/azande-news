cd "$HOME\Downloads\azande-news"

$FilePath = "app\api\cron\weekly-news\route.ts"
$FullPath = (Resolve-Path -LiteralPath $FilePath).Path
$content = [System.IO.File]::ReadAllText($FullPath)

$old = @'
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
'@

$new = @'
async function googleSearch(query: string): Promise<SearchResult[]> {
  const params = new URLSearchParams({
    key: process.env.GOOGLE_SEARCH_API_KEY!,
    cx: process.env.GOOGLE_SEARCH_CSE_ID!,
    q: query,
    num: "10",
  });
  const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params.toString()}`);
  const data = await res.json();

  if (data.error) {
    throw new Error(
      `Google Custom Search error (${data.error.code}): ${data.error.message}`
    );
  }

  return (data.items ?? []).map((item: any) => ({
    title: item.title,
    snippet: item.snippet,
    url: item.link,
  }));
}
'@

if ($content.Contains($old)) {
    $updated = $content.Replace($old, $new)
    [System.IO.File]::WriteAllText($FullPath, $updated)
    Write-Host "APPLIED - Google Search errors now surface instead of being treated as empty results" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED - could not find expected text. No changes made." -ForegroundColor Red
}

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Surface real Google Custom Search errors instead of silently returning empty results'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
