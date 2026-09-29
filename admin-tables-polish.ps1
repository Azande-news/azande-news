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

# ===== AdminPostsTable.tsx - title link hover: underline instead of color change =====
$titleHoverOld = @'
            <Link href={`/posts/${post.id}`} className="font-body font-medium text-ink hover:text-accent">
              {post.title}
            </Link>
'@

$titleHoverNew = @'
            <Link href={`/posts/${post.id}`} className="font-body font-medium text-ink hover:underline">
              {post.title}
            </Link>
'@

Apply-Fix -FilePath "components\admin\AdminPostsTable.tsx" `
    -OldText $titleHoverOld `
    -NewText $titleHoverNew `
    -Description "Post title hover: underline instead of color change (matches PostCard convention)"

# ===== AdminPostsTable.tsx - "Publish now" is constructive, not destructive; match Edit's neutral style =====
$publishBtnOld = @'
              <button
                onClick={() => publishNow(post.id)}
                disabled={busyId === post.id}
                className="text-accent hover:underline disabled:opacity-50"
              >
                Publish now
              </button>
'@

$publishBtnNew = @'
              <button
                onClick={() => publishNow(post.id)}
                disabled={busyId === post.id}
                className="text-ink hover:underline disabled:opacity-50"
              >
                Publish now
              </button>
'@

Apply-Fix -FilePath "components\admin\AdminPostsTable.tsx" `
    -OldText $publishBtnOld `
    -NewText $publishBtnNew `
    -Description "'Publish now' button: neutral ink instead of red (not a destructive action, unlike Delete)"

# ===== AdminAnalytics.tsx - remove dead rounded-sm class =====
$statCardOld = @'
    <div className="border border-border rounded-sm p-4">
'@

$statCardNew = @'
    <div className="border border-border p-4">
'@

Apply-Fix -FilePath "components\admin\AdminAnalytics.tsx" `
    -OldText $statCardOld `
    -NewText $statCardNew `
    -Description "Removed dead rounded-sm class from stat cards (design tokens already zero all border-radius)"

# ===== AdminSubscribersTable.tsx - "Copy all emails" is a utility action, not destructive =====
$copyBtnOld = @'
        <button
          onClick={copyAllEmails}
          className="text-sm font-medium text-accent hover:underline shrink-0"
        >
          {copied ? "Copied!" : "Copy all emails"}
        </button>
'@

$copyBtnNew = @'
        <button
          onClick={copyAllEmails}
          className="text-sm font-medium text-ink hover:underline shrink-0"
        >
          {copied ? "Copied!" : "Copy all emails"}
        </button>
'@

Apply-Fix -FilePath "components\admin\AdminSubscribersTable.tsx" `
    -OldText $copyBtnOld `
    -NewText $copyBtnNew `
    -Description "'Copy all emails' button: neutral ink instead of red (harmless utility action)"

# ===== AdminSubscribersTable.tsx - remove dead rounded-sm class =====
$listWrapperOld = @'
      <div className="divide-y divide-border border border-border rounded-sm max-h-80 overflow-y-auto">
'@

$listWrapperNew = @'
      <div className="divide-y divide-border border border-border max-h-80 overflow-y-auto">
'@

Apply-Fix -FilePath "components\admin\AdminSubscribersTable.tsx" `
    -OldText $listWrapperOld `
    -NewText $listWrapperNew `
    -Description "Removed dead rounded-sm class from subscriber list wrapper"

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Admin tables: cosmetic-only consistency fixes, no logic changes'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
