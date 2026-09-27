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

# ===== app/live/page.tsx - add Link import =====
$liveImportOld = @'
import { createClient } from "@/lib/supabase/server";
import { stripHtml, sanitizeHtml } from "@/lib/html";
import type { Metadata } from "next";
'@

$liveImportNew = @'
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { stripHtml, sanitizeHtml } from "@/lib/html";
import type { Metadata } from "next";
'@

Apply-Fix -FilePath "app\live\page.tsx" `
    -OldText $liveImportOld `
    -NewText $liveImportNew `
    -Description "Added Link import to Live page"

# ===== app/live/page.tsx - add Home > Live breadcrumb =====
$liveBreadcrumbOld = @'
    <div className="max-w-read">
      <div className="flex items-center gap-2 mb-2">
'@

$liveBreadcrumbNew = @'
    <div className="max-w-read">
      <nav aria-label="Breadcrumb" className="font-meta text-brevier text-grey mb-3">
        <Link href="/" className="hover:underline">Home</Link>
        <span className="mx-1.5 text-border">&rsaquo;</span>
        <span className="text-ink">Live</span>
      </nav>
      <div className="flex items-center gap-2 mb-2">
'@

Apply-Fix -FilePath "app\live\page.tsx" `
    -OldText $liveBreadcrumbOld `
    -NewText $liveBreadcrumbNew `
    -Description "Added Home > Live breadcrumb trail"

# ===== app/author/[username]/page.tsx - fix heading to match site type scale and neutral border =====
$authorHeadingOld = @'
      <h2 className="font-display text-lg font-bold text-ink border-l-4 border-accent pl-3 mb-6">
        Posts by {profile.display_name} ({authorPosts.length})
      </h2>
'@

$authorHeadingNew = @'
      <h2 className="font-display text-trafalgar font-medium text-ink border-l-4 border-ink pl-3 mb-6">
        Posts by {profile.display_name} ({authorPosts.length})
      </h2>
'@

Apply-Fix -FilePath "app\author\[username]\page.tsx" `
    -OldText $authorHeadingOld `
    -NewText $authorHeadingNew `
    -Description "Aligned author page heading with site type scale; neutral border (red reserved for live/urgent only)"

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'BBC-style pass: breadcrumb on Live page, consistent typography on author page'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
