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

# ===== app/posts/[id]/page.tsx - define breadcrumb JSON-LD =====
$articleJsonLdDefOld = @'
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://azande-news.vercel.app/posts/${post.id}`,
    },
  };

  return (
'@

$articleJsonLdDefNew = @'
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://azande-news.vercel.app/posts/${post.id}`,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://azande-news.vercel.app/" },
      { "@type": "ListItem", position: 2, name: categoryLabel, item: `https://azande-news.vercel.app/category/${post.category}` },
      { "@type": "ListItem", position: 3, name: post.title, item: `https://azande-news.vercel.app/posts/${post.id}` },
    ],
  };

  return (
'@

Apply-Fix -FilePath "app\posts\[id]\page.tsx" `
    -OldText $articleJsonLdDefOld `
    -NewText $articleJsonLdDefNew `
    -Description "Defined BreadcrumbList structured data for article page"

# ===== app/posts/[id]/page.tsx - render the breadcrumb JSON-LD script tag =====
$articleJsonLdScriptOld = @'
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-10">
'@

$articleJsonLdScriptNew = @'
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-8 gap-y-10">
'@

Apply-Fix -FilePath "app\posts\[id]\page.tsx" `
    -OldText $articleJsonLdScriptOld `
    -NewText $articleJsonLdScriptNew `
    -Description "Rendered BreadcrumbList structured data on article page"

# ===== app/category/[slug]/page.tsx - define and render breadcrumb JSON-LD =====
$categoryJsonLdOld = @'
  const [lead, ...rest] = allPosts;
  const sidebar = rest.slice(0, 4);
  const gridPosts = rest.slice(4);

  return (
    <div>
'@

$categoryJsonLdNew = @'
  const [lead, ...rest] = allPosts;
  const sidebar = rest.slice(0, 4);
  const gridPosts = rest.slice(4);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://azande-news.vercel.app/" },
      { "@type": "ListItem", position: 2, name: label, item: `https://azande-news.vercel.app/category/${params.slug}` },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
'@

Apply-Fix -FilePath "app\category\[slug]\page.tsx" `
    -OldText $categoryJsonLdOld `
    -NewText $categoryJsonLdNew `
    -Description "Added BreadcrumbList structured data to category page"

# ===== app/globals.css - clean print stylesheet (BBC articles print without site chrome) =====
$printCssOld = @'
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
'@

$printCssNew = @'
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media print {
  header, nav, footer, [aria-live="polite"] {
    display: none !important;
  }
  body {
    color: #000;
    background: #fff;
  }
  a[href]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: #555;
  }
}
'@

Apply-Fix -FilePath "app\globals.css" `
    -OldText $printCssOld `
    -NewText $printCssNew `
    -Description "Added print stylesheet (strips header/nav/footer/breaking-bar when printing, matching BBC's clean print articles)"

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Add BreadcrumbList structured data and a clean print stylesheet'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
