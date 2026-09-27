cd "$HOME\Downloads\azande-news"

function Apply-Fix {
    param(
        [string]$FilePath,
        [string]$OldText,
        [string]$NewText,
        [string]$Description
    )

    if (-not (Test-Path $FilePath)) {
        Write-Host "SKIPPED - file not found: $FilePath" -ForegroundColor Yellow
        return
    }

    $FullPath = (Resolve-Path $FilePath).Path
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

Write-Host ""
Write-Host "Done. Review the changes with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'BBC-style pass: footer hairline instead of decorative red, remove duplicate write-a-post links'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
