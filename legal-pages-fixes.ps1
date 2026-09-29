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

# ===== app/contact/page.tsx - neutral link color instead of decorative red =====
$contactLinkOld = @'
          <a
            href="mailto:azandenews@gmail.com"
            className="text-accent hover:underline text-lg font-medium"
          >
            azandenews@gmail.com
          </a>
'@

$contactLinkNew = @'
          <a
            href="mailto:azandenews@gmail.com"
            className="text-ink underline underline-offset-2 hover:no-underline text-lg font-medium"
          >
            azandenews@gmail.com
          </a>
'@

Apply-Fix -FilePath "app\contact\page.tsx" `
    -OldText $contactLinkOld `
    -NewText $contactLinkNew `
    -Description "Contact email link: neutral ink color instead of decorative red (matches About page's link style)"

# ===== app/privacy/page.tsx - consistent body text color =====
$privacyColorOld = @'
      <div className="prose-article font-body text-ink/90 space-y-5">
'@

$privacyColorNew = @'
      <div className="prose-article font-body text-grey-dark space-y-5">
'@

Apply-Fix -FilePath "app\privacy\page.tsx" `
    -OldText $privacyColorOld `
    -NewText $privacyColorNew `
    -Description "Aligned Privacy policy body text color with sitewide convention (text-grey-dark)"

# ===== app/terms/page.tsx - consistent body text color =====
$termsColorOld = @'
      <div className="prose-article font-body text-ink/90 space-y-5">
'@

$termsColorNew = @'
      <div className="prose-article font-body text-grey-dark space-y-5">
'@

Apply-Fix -FilePath "app\terms\page.tsx" `
    -OldText $termsColorOld `
    -NewText $termsColorNew `
    -Description "Aligned Terms of use body text color with sitewide convention (text-grey-dark)"

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Fix decorative red on contact link; consistent body text color on Privacy and Terms pages'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
