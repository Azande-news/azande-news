cd "$HOME\Downloads\azande-news"

function Apply-Fix {
    param(
        [string]$FilePath,
        [string]$OldText,
        [string]$NewText,
        [string]$Description
    )

    if (-not (Test-Path -LiteralPath $FilePath)) {
        Write-Host "SKIPPED - file not found: $FilePath" -ForegroundColor Yellow
        return
    }

    $FullPath = (Resolve-Path -LiteralPath $FilePath).Path
    $content = [System.IO.File]::ReadAllText($FullPath)

    if ($content.Contains($OldText)) {
        $updated = $content.Replace($OldText, $NewText)
        [System.IO.File]::WriteAllText($FullPath, $updated)
        Write-Host "APPLIED - $Description ($FilePath)" -ForegroundColor Green
    }
    else {
        Write-Host "NOT APPLIED - could not find expected text in $FilePath. The file may have changed since we last checked it. No changes were made to this file." -ForegroundColor Red
        Write-Host "  -> Fix skipped: $Description" -ForegroundColor Red
    }
}

# ===== app/search/page.tsx - neutral hover instead of red (matches fix applied everywhere else) =====
$searchBtnOld = @'
            className="bg-ink text-paper px-5 py-2.5 font-meta text-brevier font-semibold hover:bg-accent transition-colors"
'@

$searchBtnNew = @'
            className="bg-ink text-paper px-5 py-2.5 font-meta text-brevier font-semibold hover:opacity-90 transition-colors"
'@

Apply-Fix -FilePath "app\search\page.tsx" `
    -OldText $searchBtnOld `
    -NewText $searchBtnNew `
    -Description "Search page button: neutral hover instead of red (matches SearchBox, Publish, and comment button fixes)"

# ===== app/editorial-standards/page.tsx - use text-grey-dark for body copy, matching About page convention =====
$editorialColorOld = @'
      <div className="prose-article font-body text-ink/90 space-y-5">
'@

$editorialColorNew = @'
      <div className="prose-article font-body text-grey-dark space-y-5">
'@

Apply-Fix -FilePath "app\editorial-standards\page.tsx" `
    -OldText $editorialColorOld `
    -NewText $editorialColorNew `
    -Description "Aligned editorial-standards body text color with sitewide convention (text-grey-dark, matching About page)"

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Fix red hover on search button; consistent body text color on editorial-standards page'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
