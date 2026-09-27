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

# ===== app/posts/new/page.tsx - add standfirst state =====
$stateOld = @'
  const [body, setBody] = useState("");
'@

$stateNew = @'
  const [body, setBody] = useState("");
  const [standfirst, setStandfirst] = useState("");
'@

Apply-Fix -FilePath "app\posts\new\page.tsx" `
    -OldText $stateOld `
    -NewText $stateNew `
    -Description "Added standfirst state to new-post form"

# ===== app/posts/new/page.tsx - add standfirst form field between Title and Category =====
$formFieldOld = @'
            className="w-full border border-border px-3 py-2 font-body focus:outline-none focus:border-ink"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-body text-sm text-ink">Category</label>
'@

$formFieldNew = @'
            className="w-full border border-border px-3 py-2 font-body focus:outline-none focus:border-ink"
          />
        </div>

        <div>
          <label className="block font-body text-sm text-ink mb-1">Standfirst <span className="text-grey">(optional)</span></label>
          <textarea
            value={standfirst}
            onChange={(e) => setStandfirst(e.target.value)}
            rows={2}
            maxLength={220}
            placeholder="A one or two sentence summary shown below the headline"
            className="w-full border border-border px-3 py-2 font-body text-sm focus:outline-none focus:border-ink"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block font-body text-sm text-ink">Category</label>
'@

Apply-Fix -FilePath "app\posts\new\page.tsx" `
    -OldText $formFieldOld `
    -NewText $formFieldNew `
    -Description "Added Standfirst field to new-post form"

# ===== app/posts/new/page.tsx - include standfirst in insert payload =====
$payloadOld = @'
        category,
        author_id: user.id,
        cover_image_url: coverImageUrl,
'@

$payloadNew = @'
        category,
        standfirst: standfirst.trim() || null,
        author_id: user.id,
        cover_image_url: coverImageUrl,
'@

Apply-Fix -FilePath "app\posts\new\page.tsx" `
    -OldText $payloadOld `
    -NewText $payloadNew `
    -Description "Included standfirst in the post insert payload"

# ===== app/posts/[id]/page.tsx - fetch standfirst in generateMetadata =====
$metaSelectOld = @'
    .select("title, body, cover_image_url")
'@

$metaSelectNew = @'
    .select("title, body, standfirst, cover_image_url")
'@

Apply-Fix -FilePath "app\posts\[id]\page.tsx" `
    -OldText $metaSelectOld `
    -NewText $metaSelectNew `
    -Description "Included standfirst in article metadata query"

$metaDescOld = @'
  const description = stripHtml(post.body).slice(0, 160);
'@

$metaDescNew = @'
  const description = post.standfirst || stripHtml(post.body).slice(0, 160);
'@

Apply-Fix -FilePath "app\posts\[id]\page.tsx" `
    -OldText $metaDescOld `
    -NewText $metaDescNew `
    -Description "Meta description now prefers standfirst when present"

# ===== app/posts/[id]/page.tsx - fetch standfirst in main query =====
$mainSelectOld = @'
      "id, title, body, category, created_at, updated_at, author_id, cover_image_url, image_caption, image_credit, profiles(display_name, username)"
'@

$mainSelectNew = @'
      "id, title, body, standfirst, category, created_at, updated_at, author_id, cover_image_url, image_caption, image_credit, profiles(display_name, username)"
'@

Apply-Fix -FilePath "app\posts\[id]\page.tsx" `
    -OldText $mainSelectOld `
    -NewText $mainSelectNew `
    -Description "Included standfirst in article page query"

# ===== app/posts/[id]/page.tsx - JSON-LD description prefers standfirst =====
$jsonLdOld = @'
    description: stripHtml(post.body).slice(0, 160),
'@

$jsonLdNew = @'
    description: post.standfirst || stripHtml(post.body).slice(0, 160),
'@

Apply-Fix -FilePath "app\posts\[id]\page.tsx" `
    -OldText $jsonLdOld `
    -NewText $jsonLdNew `
    -Description "Structured data description now prefers standfirst when present"

# ===== app/posts/[id]/page.tsx - display standfirst between headline and byline =====
$displayOld = @'
            <h1 className="font-display text-canon sm:text-canon-lg font-medium text-ink mb-4">
              {post.title}
            </h1>

            <div className="font-meta text-brevier text-grey pb-4 mb-6 border-b border-rule">
'@

$displayNew = @'
            <h1 className="font-display text-canon sm:text-canon-lg font-medium text-ink mb-4">
              {post.title}
            </h1>

            {post.standfirst && (
              <p className="font-body text-paragon font-medium text-grey-dark mb-4">
                {post.standfirst}
              </p>
            )}

            <div className="font-meta text-brevier text-grey pb-4 mb-6 border-b border-rule">
'@

Apply-Fix -FilePath "app\posts\[id]\page.tsx" `
    -OldText $displayOld `
    -NewText $displayNew `
    -Description "Displayed standfirst between headline and byline (BBC's real pattern)"

# ===== components/PostCard.tsx - add standfirst to Post type =====
$typeOld = @'
type Post = {
  id: string;
  title: string;
  body: string;
  category: string;
'@

$typeNew = @'
type Post = {
  id: string;
  title: string;
  body: string;
  standfirst?: string | null;
  category: string;
'@

Apply-Fix -FilePath "components\PostCard.tsx" `
    -OldText $typeOld `
    -NewText $typeNew `
    -Description "Added standfirst to PostCard's Post type"

# ===== components/PostCard.tsx - lead variant uses standfirst as excerpt when present =====
$leadOld = @'
  if (v === "lead") {
    const excerpt = stripHtml(post.body).slice(0, 220);
'@

$leadNew = @'
  if (v === "lead") {
    const leadSource = post.standfirst || stripHtml(post.body);
    const excerpt = leadSource.slice(0, 220);
'@

Apply-Fix -FilePath "components\PostCard.tsx" `
    -OldText $leadOld `
    -NewText $leadNew `
    -Description "Lead card excerpt now prefers standfirst when present"

$leadEllipsisOld = @'
        <Link href={`/posts/${post.id}`} className="group">
          <h2 className="font-display text-canon sm:text-canon-lg font-medium text-ink mb-2 group-hover:underline underline-offset-2">
            {post.title}
          </h2>
          <p className="font-body text-body-copy text-grey">
            {excerpt}
            {post.body.length > excerpt.length ? "…" : ""}
          </p>
        </Link>
        <Meta className="mt-3" />
      </article>
    );
  }
'@

$leadEllipsisNew = @'
        <Link href={`/posts/${post.id}`} className="group">
          <h2 className="font-display text-canon sm:text-canon-lg font-medium text-ink mb-2 group-hover:underline underline-offset-2">
            {post.title}
          </h2>
          <p className="font-body text-body-copy text-grey">
            {excerpt}
            {leadSource.length > excerpt.length ? "…" : ""}
          </p>
        </Link>
        <Meta className="mt-3" />
      </article>
    );
  }
'@

Apply-Fix -FilePath "components\PostCard.tsx" `
    -OldText $leadEllipsisOld `
    -NewText $leadEllipsisNew `
    -Description "Fixed lead card ellipsis logic to match its actual excerpt source"

# ===== components/PostCard.tsx - grid variant uses standfirst as excerpt when present =====
$gridOld = @'
  const excerpt = stripHtml(post.body).slice(0, 110);
  return (
    <article className="pb-2">
'@

$gridNew = @'
  const gridSource = post.standfirst || stripHtml(post.body);
  const excerpt = gridSource.slice(0, 110);
  return (
    <article className="pb-2">
'@

Apply-Fix -FilePath "components\PostCard.tsx" `
    -OldText $gridOld `
    -NewText $gridNew `
    -Description "Grid card excerpt now prefers standfirst when present"

$gridEllipsisOld = @'
        <p className="font-body text-brevier text-grey line-clamp-2">
          {excerpt}
          {post.body.length > excerpt.length ? "…" : ""}
        </p>
'@

$gridEllipsisNew = @'
        <p className="font-body text-brevier text-grey line-clamp-2">
          {excerpt}
          {gridSource.length > excerpt.length ? "…" : ""}
        </p>
'@

Apply-Fix -FilePath "components\PostCard.tsx" `
    -OldText $gridEllipsisOld `
    -NewText $gridEllipsisNew `
    -Description "Fixed grid card ellipsis logic to match its actual excerpt source"

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Add standfirst feature: post editor field, article display, smarter card excerpts'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
