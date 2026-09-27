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

# ===== Fix 1: MainNav.tsx - remove duplicate "Write a Post" link =====
$mainNavOld = @'
  { href: "/dictionary", label: "Dictionary" },
  { href: "/posts/new", label: "Write a Post" },
];
'@

$mainNavNew = @'
  { href: "/dictionary", label: "Dictionary" },
];
'@

Apply-Fix -FilePath "components\MainNav.tsx" `
    -OldText $mainNavOld `
    -NewText $mainNavNew `
    -Description "Removed duplicate 'Write a Post' link from MainNav"

# ===== Fix 2: PostCard.tsx - category-first meta, drop AuthorLink =====
$postCardMetaOld = @'
  const Meta = ({ className = "" }: { className?: string }) => (
    <div className={`font-meta text-minion text-grey ${className}`}>
      <span><SmartTime iso={post.created_at} /></span>
      <span className="mx-1.5 text-border">|</span>
      <Link href={`/category/${post.category}`} className="hover:underline">
        {categoryLabel}
      </Link>
    </div>
  );

  const AuthorLink = ({ className = "" }: { className?: string }) => (
    <div className={`font-meta text-minion text-grey ${className}`}>
      {post.profiles?.username ? (
        <Link href={`/author/${post.profiles.username}`} className="hover:underline">
          {post.profiles.display_name}
        </Link>
      ) : (
        "Unknown"
      )}
    </div>
  );
'@

$postCardMetaNew = @'
  const Meta = ({ className = "" }: { className?: string }) => (
    <div className={`font-meta text-minion text-grey ${className}`}>
      <Link href={`/category/${post.category}`} className="hover:underline text-accent">
        {categoryLabel}
      </Link>
      <span className="mx-1.5 text-border">|</span>
      <span><SmartTime iso={post.created_at} /></span>
    </div>
  );
'@

Apply-Fix -FilePath "components\PostCard.tsx" `
    -OldText $postCardMetaOld `
    -NewText $postCardMetaNew `
    -Description "Reordered PostCard meta to category-first, removed AuthorLink component"

$postCardUsageOld = @'
      <Meta className="mt-2" />
      <AuthorLink className="mt-1" />
'@

$postCardUsageNew = @'
      <Meta className="mt-2" />
'@

Apply-Fix -FilePath "components\PostCard.tsx" `
    -OldText $postCardUsageOld `
    -NewText $postCardUsageNew `
    -Description "Removed AuthorLink usage from PostCard grid variant"

# ===== Fix 3: Footer.tsx - reserve accent red for urgency, not decoration =====
$footerOld = @'
    <footer className="bg-black text-white/70 mt-16 border-t-4 border-accent">
'@

$footerNew = @'
    <footer className="bg-black text-white/70 mt-16 border-t border-white/15">
'@

Apply-Fix -FilePath "components\Footer.tsx" `
    -OldText $footerOld `
    -NewText $footerNew `
    -Description "Replaced footer's decorative red border with a neutral hairline (red now reserved for live/urgent signals only)"

# ===== Fix 4: app/posts/[id]/page.tsx - remove duplicate "Write a Post" link =====
$postPageOld = @'
              <Link
                href="/dictionary"
                className="block py-2.5 border-b border-rule text-ink hover:underline"
              >
                Zande Dictionary
              </Link>
              <Link
                href="/posts/new"
                className="block py-2.5 text-ink hover:underline"
              >
                Write a Post
              </Link>
'@

$postPageNew = @'
              <Link
                href="/dictionary"
                className="block py-2.5 text-ink hover:underline"
              >
                Zande Dictionary
              </Link>
'@

Apply-Fix -FilePath "app\posts\[id]\page.tsx" `
    -OldText $postPageOld `
    -NewText $postPageNew `
    -Description "Removed duplicate 'Write a Post' link from article sidebar (already in masthead)"

# ===== Fix 5: globals.css - style tables inside articles (BBC reference-table look) =====
$cssOld = @'
.prose-article a {
  color: var(--color-ink);
  text-decoration: underline;
  text-underline-offset: 2px;
}
'@

$cssNew = @'
.prose-article a {
  color: var(--color-ink);
  text-decoration: underline;
  text-underline-offset: 2px;
}
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

Apply-Fix -FilePath "app\globals.css" `
    -OldText $cssOld `
    -NewText $cssNew `
    -Description "Added BBC-style reference-table styling to prose-article (needed for the pronoun tables)"

# ===== Fix 6: app/posts/[id]/page.tsx - add breadcrumb trail (Home > Category) =====
$breadcrumbArticleOld = @'
          <div className="max-w-read">
            <h1 className="font-display text-canon sm:text-canon-lg font-medium text-ink mb-4">
              {post.title}
            </h1>
'@

$breadcrumbArticleNew = @'
          <div className="max-w-read">
            <nav aria-label="Breadcrumb" className="font-meta text-brevier text-grey mb-3">
              <Link href="/" className="hover:underline">Home</Link>
              <span className="mx-1.5 text-border">&rsaquo;</span>
              <Link href={`/category/${post.category}`} className="hover:underline">{categoryLabel}</Link>
            </nav>
            <h1 className="font-display text-canon sm:text-canon-lg font-medium text-ink mb-4">
              {post.title}
            </h1>
'@

Apply-Fix -FilePath "app\posts\[id]\page.tsx" `
    -OldText $breadcrumbArticleOld `
    -NewText $breadcrumbArticleNew `
    -Description "Added Home > Category breadcrumb trail above article headline"

# ===== Fix 7: app/category/[slug]/page.tsx - add breadcrumb trail, import Link =====
$categoryImportOld = @'
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
'@

$categoryImportNew = @'
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
'@

Apply-Fix -FilePath "app\category\[slug]\page.tsx" `
    -OldText $categoryImportOld `
    -NewText $categoryImportNew `
    -Description "Added Link import to category page"

$breadcrumbCategoryOld = @'
      <div className="pb-6 mb-8 border-b-4 border-ink">
        <h1 className="font-display text-canon sm:text-canon-lg font-medium text-ink">
          {label}
        </h1>
'@

$breadcrumbCategoryNew = @'
      <div className="pb-6 mb-8 border-b-4 border-ink">
        <nav aria-label="Breadcrumb" className="font-meta text-brevier text-grey mb-3">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1.5 text-border">&rsaquo;</span>
          <span className="text-ink">{label}</span>
        </nav>
        <h1 className="font-display text-canon sm:text-canon-lg font-medium text-ink">
          {label}
        </h1>
'@

Apply-Fix -FilePath "app\category\[slug]\page.tsx" `
    -OldText $breadcrumbCategoryOld `
    -NewText $breadcrumbCategoryNew `
    -Description "Added Home > [Category] breadcrumb trail above category page title"

# ===== Fix 8: BreakingBar.tsx - announce breaking news to screen readers =====
$breakingBarOld = @'
  return (
    <div className="bg-accent text-white">
      <div className="max-w-shell mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
'@

$breakingBarNew = @'
  return (
    <div className="bg-accent text-white" role="status" aria-live="polite">
      <div className="max-w-shell mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
'@

Apply-Fix -FilePath "components\BreakingBar.tsx" `
    -OldText $breakingBarOld `
    -NewText $breakingBarNew `
    -Description "Made breaking-news bar announce itself to screen readers (matches BBC's accessible live-update pattern)"

Write-Host ""
Write-Host "Done. Review the changes with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'BBC-style pass: add breadcrumb trails, make breaking bar screen-reader accessible'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
