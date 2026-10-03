cd "$HOME\Downloads\azande-news"

$FilePath = "next.config.mjs"
$FullPath = (Resolve-Path -LiteralPath $FilePath).Path
$content = [System.IO.File]::ReadAllText($FullPath)

# ===== Fix 1: widen Next.js image remotePatterns =====
$old1 = @'
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
'@

$new1 = @'
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
'@

if ($content.Contains($old1)) {
    $content = $content.Replace($old1, $new1)
    Write-Host "APPLIED (1/2) - Next.js image optimizer now accepts any https image source" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED (1/2) - text not found" -ForegroundColor Red
}

# ===== Fix 2: widen the CSP img-src directive to match =====
$old2 = 'img-src ''self'' data: https://*.supabase.co;'
$new2 = 'img-src ''self'' data: https:;'

if ($content.Contains($old2)) {
    $content = $content.Replace($old2, $new2)
    Write-Host "APPLIED (2/2) - Content-Security-Policy now allows images from any https source (other directives unchanged)" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED (2/2) - text not found" -ForegroundColor Red
}

[System.IO.File]::WriteAllText($FullPath, $content)

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Allow external news-site images (Next.js optimizer and CSP), needed for AI-drafted article cover photos'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
