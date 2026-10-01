cd "$HOME\Downloads\azande-news"

$FilePath = "app\api\cron\weekly-news\route.ts"
$FullPath = (Resolve-Path -LiteralPath $FilePath).Path
$content = [System.IO.File]::ReadAllText($FullPath)

$old = 'model: "llama-3.3-70b-versatile",'
$new = 'model: "openai/gpt-oss-120b",'

if ($content.Contains($old)) {
    $updated = $content.Replace($old, $new)
    [System.IO.File]::WriteAllText($FullPath, $updated)
    Write-Host "APPLIED - Updated to openai/gpt-oss-120b (Groq's official replacement for the deprecated llama-3.3-70b-versatile)" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED - could not find expected text. No changes made." -ForegroundColor Red
}

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Update to current Groq production model (openai/gpt-oss-120b)'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
