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

# ===== app/posts/new/page.tsx - Publish button =====
$publishBtnOld = @'
          className="bg-ink text-paper px-6 py-3 hover:bg-accent-dark transition-colors font-meta text-brevier font-semibold disabled:opacity-60"
'@

$publishBtnNew = @'
          className="bg-ink text-paper px-6 py-3 hover:opacity-90 transition-colors font-meta text-brevier font-semibold disabled:opacity-60"
'@

Apply-Fix -FilePath "app\posts\new\page.tsx" `
    -OldText $publishBtnOld `
    -NewText $publishBtnNew `
    -Description "Publish button: neutral hover instead of red (red reserved for live/breaking only)"

# ===== app/posts/new/page.tsx - cover photo file input =====
$fileInputOld = @'
            className="w-full font-body text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-ink file:text-paper file:cursor-pointer hover:file:bg-accent"
'@

$fileInputNew = @'
            className="w-full font-body text-sm file:mr-4 file:py-2 file:px-4 file:border-0 file:bg-ink file:text-paper file:cursor-pointer hover:file:opacity-90"
'@

Apply-Fix -FilePath "app\posts\new\page.tsx" `
    -OldText $fileInputOld `
    -NewText $fileInputNew `
    -Description "Cover photo upload button: neutral hover instead of red"

# ===== components/CommentSection.tsx - Post comment button =====
$commentBtnOld = @'
            className="bg-ink text-paper px-5 py-2 rounded-sm hover:bg-accent transition-colors font-body text-sm font-medium disabled:opacity-60"
'@

$commentBtnNew = @'
            className="bg-ink text-paper px-5 py-2 hover:opacity-90 transition-colors font-body text-sm font-medium disabled:opacity-60"
'@

Apply-Fix -FilePath "components\CommentSection.tsx" `
    -OldText $commentBtnOld `
    -NewText $commentBtnNew `
    -Description "Post comment button: neutral hover instead of red"

# ===== components/SearchBox.tsx - Search button =====
$searchBtnOld = @'
        className="bg-ink text-white px-4 py-1.5 rounded-sm text-sm font-medium hover:bg-accent-light transition-colors shrink-0"
'@

$searchBtnNew = @'
        className="bg-ink text-white px-4 py-1.5 text-sm font-medium hover:opacity-90 transition-colors shrink-0"
'@

Apply-Fix -FilePath "components\SearchBox.tsx" `
    -OldText $searchBtnOld `
    -NewText $searchBtnNew `
    -Description "Search button: neutral hover instead of red"

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Reserve accent red for live/breaking signals only: neutral button hovers site-wide'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
