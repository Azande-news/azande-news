cd "$HOME\Downloads\azande-news"

$FilePath = "app\globals.css"
$FullPath = (Resolve-Path -LiteralPath $FilePath).Path
$content = [System.IO.File]::ReadAllText($FullPath)

$duplicatedBlock = @'
.prose-article table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
  font-family: var(--font-sans), Helvetica, Arial, sans-serif;
  font-size: 15px;
  line-height: 20px;
}
.prose-article th,
.prose-article td {
  text-align: left;
  padding: 0.6rem 0.9rem;
  border-bottom: 1px solid var(--color-rule);
}
.prose-article th {
  font-weight: 700;
  color: var(--color-ink);
  border-bottom: 2px solid var(--color-ink);
}
.prose-article td {
  color: var(--color-grey);
}
'@

$doubledUp = $duplicatedBlock + "`r`n" + $duplicatedBlock

if ($content.Contains($doubledUp)) {
    $updated = $content.Replace($doubledUp, $duplicatedBlock)
    [System.IO.File]::WriteAllText($FullPath, $updated)
    Write-Host "FIXED - removed duplicated table CSS block from app\globals.css" -ForegroundColor Green
}
else {
    # Line endings can vary; try LF-only join as a fallback
    $doubledUpLf = $duplicatedBlock + "`n" + $duplicatedBlock
    if ($content.Contains($doubledUpLf)) {
        $updated = $content.Replace($doubledUpLf, $duplicatedBlock)
        [System.IO.File]::WriteAllText($FullPath, $updated)
        Write-Host "FIXED - removed duplicated table CSS block from app\globals.css (LF variant)" -ForegroundColor Green
    }
    else {
        Write-Host "NOT FOUND - could not locate the exact duplicated block. Open app\globals.css manually and delete the second, repeated copy of the .prose-article table / th / td rules." -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Fix duplicated table CSS rules in globals.css'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
