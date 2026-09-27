cd "$HOME\Downloads\azande-news"

$filesToMove = @(
    "apply-bbc-fixes.ps1",
    "apply-bbc-fixes-v2.ps1",
    "apply-bbc-fixes-v3.ps1",
    "apply-bbc-fixes-v4.ps1",
    "apply-bbc-fixes-v5.ps1",
    "full-bbc-rewrite.ps1",
    "full-bbc-rewrite.sql",
    "batch1-updates.sql",
    "posts-export.json"
)

if (-not (Test-Path "scripts")) {
    New-Item -ItemType Directory -Path "scripts" | Out-Null
    Write-Host "Created scripts\ folder" -ForegroundColor Cyan
}

foreach ($file in $filesToMove) {
    if (Test-Path -LiteralPath $file) {
        git mv $file "scripts\$file"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "MOVED - $file -> scripts\$file" -ForegroundColor Green
        } else {
            Write-Host "FAILED to move $file (see git output above)" -ForegroundColor Red
        }
    } else {
        Write-Host "SKIPPED - $file not found (already moved, or never existed at repo root)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Done. Review with 'git status', then commit and push:" -ForegroundColor Cyan
Write-Host "  git status" -ForegroundColor White
Write-Host "  git commit -m 'Tidy repo: move one-off scripts and data exports into scripts/'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
