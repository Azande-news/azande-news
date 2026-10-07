cd "$HOME\Downloads\azande-news"

$FilePath = "app\api\cron\weekly-news\route.ts"
$FullPath = (Resolve-Path -LiteralPath $FilePath).Path
$content = [System.IO.File]::ReadAllText($FullPath)

# ===== Fix 1: stop truncating snippets so aggressively that real facts get cut off =====
$old1 = @'
    const trimmedResults = allResults.slice(0, 30).map((r) => ({
      ...r,
      snippet: r.snippet.length > 400 ? r.snippet.slice(0, 400) + "..." : r.snippet,
    }));
'@

$new1 = @'
    const trimmedResults = allResults.slice(0, 30).map((r) => ({
      ...r,
      snippet: r.snippet.length > 1500 ? r.snippet.slice(0, 1500) + "..." : r.snippet,
    }));
'@

if ($content.Contains($old1)) {
    $content = $content.Replace($old1, $new1)
    Write-Host "APPLIED (1/2) - Raised snippet limit from 400 to 1500 characters, so specific facts (names, numbers, dates) aren't cut off before reaching the model" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED (1/2) - text not found" -ForegroundColor Red
}

# ===== Fix 2: explicit anti-fabrication instruction =====
$old2 = @'
Below are REAL web search results from this week. Use ONLY the information in these results. Do not add any fact, name, date, or detail that is not present in them - if it is not in the results, it does not go in the article.
'@

$new2 = @'
Below are REAL web search results from this week. Use ONLY the information in these results. Do not add any fact, name, date, or detail that is not present in them - if it is not in the results, it does not go in the article.

NEVER INVENT PLAUSIBLE-SOUNDING FILLER. Do not add reactions, causes, consequences, named officials, follow-up actions, or background that are not explicitly stated in the source text, even if they sound like the kind of thing that would plausibly happen in a story like this. Examples of what NOT to do: inventing that a release happened "following negotiations" when the source doesn't say why it happened; inventing that officials "urged" some response when no such statement is in the source; inventing that "local NGOs pledged support" or similar generic follow-up when it is not stated. If the source material only supports a short article, write a SHORT article using only confirmed facts - do not pad it out to a standard length with invented specifics. Every sentence must be traceable to something actually stated in the source text above. A short, fully accurate article is always better than a longer one containing invented plausible-sounding material.
'@

if ($content.Contains($old2)) {
    $content = $content.Replace($old2, $new2)
    Write-Host "APPLIED (2/2) - Added explicit anti-fabrication instruction with concrete examples of what not to invent" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED (2/2) - text not found" -ForegroundColor Red
}

[System.IO.File]::WriteAllText($FullPath, $content)

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Fix snippet truncation causing fabricated filler; add explicit anti-fabrication instruction'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
