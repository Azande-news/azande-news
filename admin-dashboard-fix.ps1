cd "$HOME\Downloads\azande-news"

$FilePath = "app\admin\page.tsx"
$FullPath = (Resolve-Path -LiteralPath $FilePath).Path
$content = [System.IO.File]::ReadAllText($FullPath)

$old = 'border-l-4 border-accent'
$new = 'border-l-4 border-ink'

$count = ([regex]::Matches($content, [regex]::Escape($old))).Count

if ($count -gt 0) {
    $updated = $content.Replace($old, $new)
    [System.IO.File]::WriteAllText($FullPath, $updated)
    Write-Host "APPLIED - Replaced $count decorative red section-header border(s) with neutral ink ($FilePath)" -ForegroundColor Green
}
else {
    Write-Host "NOT APPLIED - could not find expected text in $FilePath. The file may have changed since we last checked it. No changes were made to this file." -ForegroundColor Red
}

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Admin dashboard: neutral section-header borders, red reserved for live/urgent only'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
