cd "$HOME\Downloads\azande-news"

$FilePath = "app\api\cron\weekly-news\route.ts"
$FullPath = (Resolve-Path -LiteralPath $FilePath).Path
$content = [System.IO.File]::ReadAllText($FullPath)

# ===== Fix 1: trim oversized snippets and cap how many results go to Groq =====
$old1 = @'
    const searchResultsText = allResults
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
      .join("\n\n");
'@

$new1 = @'
    const trimmedResults = allResults.slice(0, 30).map((r) => ({
      ...r,
      snippet: r.snippet.length > 400 ? r.snippet.slice(0, 400) + "..." : r.snippet,
    }));

    const searchResultsText = trimmedResults
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
      .join("\n\n");
'@

if ($content.Contains($old1)) {
    $content = $content.Replace($old1, $new1)
    Write-Host "APPLIED - Trimmed oversized snippets and capped results sent to Groq (top 30, 400 chars each)" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED (1/2) - text not found" -ForegroundColor Red
}

# ===== Fix 2: surface real Groq errors instead of silently defaulting to "{}" =====
$old2 = @'
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(text);
'@

$new2 = @'
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
'@

if ($content.Contains($old2)) {
    $content = $content.Replace($old2, $new2)
    Write-Host "APPLIED - Groq errors now surface instead of silently defaulting to an empty result" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED (2/2) - text not found" -ForegroundColor Red
}

[System.IO.File]::WriteAllText($FullPath, $content)

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Surface real Groq errors; trim and cap search results sent to the model'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
