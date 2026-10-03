cd "$HOME\Downloads\azande-news"

$FilePath = "app\api\cron\weekly-news\route.ts"
$FullPath = (Resolve-Path -LiteralPath $FilePath).Path
$content = [System.IO.File]::ReadAllText($FullPath)

# ===== Fix 1: rewrite tavilySearch to also fetch real candidate images =====
$old1 = @'
async function tavilySearch(query: string): Promise<SearchResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      topic: "news",
      days: 10,
      max_results: 8,
    }),
  });

  const rawText = await res.text();

  if (!res.ok) {
    throw new Error(`Tavily search failed (HTTP ${res.status}): ${rawText}`);
  }

  const data = JSON.parse(rawText);

  if (data.error) {
    throw new Error(`Tavily search error: ${data.error}`);
  }

  if (!Array.isArray(data.results)) {
    throw new Error(`Tavily returned an unexpected shape: ${rawText}`);
  }

  return data.results.map((item: any) => ({
    title: item.title,
    snippet: item.content,
    url: item.url,
  }));
}
'@

$new1 = @'
type ImageCandidate = { url: string; description: string };

async function tavilySearch(query: string): Promise<{ results: SearchResult[]; images: ImageCandidate[] }> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: process.env.TAVILY_API_KEY,
      query,
      topic: "news",
      days: 10,
      max_results: 8,
      include_images: true,
      include_image_descriptions: true,
    }),
  });

  const rawText = await res.text();

  if (!res.ok) {
    throw new Error(`Tavily search failed (HTTP ${res.status}): ${rawText}`);
  }

  const data = JSON.parse(rawText);

  if (data.error) {
    throw new Error(`Tavily search error: ${data.error}`);
  }

  if (!Array.isArray(data.results)) {
    throw new Error(`Tavily returned an unexpected shape: ${rawText}`);
  }

  const results = data.results.map((item: any) => ({
    title: item.title,
    snippet: item.content,
    url: item.url,
  }));

  const images: ImageCandidate[] = Array.isArray(data.images)
    ? data.images.map((img: any) =>
        typeof img === "string"
          ? { url: img, description: "" }
          : { url: img.url, description: img.description ?? "" }
      )
    : [];

  return { results, images };
}
'@

if ($content.Contains($old1)) {
    $content = $content.Replace($old1, $new1)
    Write-Host "APPLIED (1/6) - tavilySearch now also fetches real candidate images" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED (1/6) - text not found" -ForegroundColor Red
}

# ===== Fix 2: collect images alongside results in the query loop =====
$old2 = @'
    const rawResults: SearchResult[] = [];
    for (const q of queries) {
      const results = await tavilySearch(q);
      rawResults.push(...results);
    }

    const seenUrls = new Set<string>();
    const allResults = rawResults.filter((r) => {
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

    if (allResults.length === 0) {
      return NextResponse.json({ status: "no-search-results-this-week" });
    }
'@

$new2 = @'
    const rawResults: SearchResult[] = [];
    const rawImages: ImageCandidate[] = [];
    for (const q of queries) {
      const { results, images } = await tavilySearch(q);
      rawResults.push(...results);
      rawImages.push(...images);
    }

    const seenUrls = new Set<string>();
    const allResults = rawResults.filter((r) => {
      if (seenUrls.has(r.url)) return false;
      seenUrls.add(r.url);
      return true;
    });

    const seenImageUrls = new Set<string>();
    const allImages = rawImages
      .filter((img) => {
        if (!img.url || seenImageUrls.has(img.url)) return false;
        seenImageUrls.add(img.url);
        return true;
      })
      .slice(0, 15);

    if (allResults.length === 0) {
      return NextResponse.json({ status: "no-search-results-this-week" });
    }
'@

if ($content.Contains($old2)) {
    $content = $content.Replace($old2, $new2)
    Write-Host "APPLIED (2/6) - Collecting and de-duplicating candidate images" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED (2/6) - text not found" -ForegroundColor Red
}

# ===== Fix 3: build the image candidates text block for the prompt =====
$old3 = @'
    const searchResultsText = trimmedResults
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
      .join("\n\n");
'@

$new3 = @'
    const searchResultsText = trimmedResults
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}\nURL: ${r.url}`)
      .join("\n\n");

    const imageCandidatesText = allImages.length > 0
      ? allImages
          .map((img, i) => `[Image ${i + 1}] URL: ${img.url}${img.description ? `\nDescription: ${img.description}` : ""}`)
          .join("\n\n")
      : "No candidate images were found.";
'@

if ($content.Contains($old3)) {
    $content = $content.Replace($old3, $new3)
    Write-Host "APPLIED (3/6) - Built image candidates text block" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED (3/6) - text not found" -ForegroundColor Red
}

# ===== Fix 4: strengthen the prompt with date/freshness/image-selection rules =====
$old4 = @'
If none of the results describe a genuine, specific, relevant story, respond with exactly this JSON and nothing else:
{"found": false}

COMPLETENESS IS A FACTUAL-ACCURACY REQUIREMENT, NOT A STYLE CHOICE. If the source material you draw from contains serious findings - human rights allegations, casualties, deaths, war crimes findings, criminal conduct, displacement, or other significant harms - connected to the subject of your article, you MUST include them, even if the main angle of the story is something else (such as a territorial gain, an appointment, or an achievement). Omitting documented serious harm while reporting only a neutral or positive framing of the same subject is a factual-completeness failure, not an acceptable editorial choice. When in doubt, include more from the source rather than less.

If you find a genuine story, write it in BBC News house style: sentence-case headline, tight one-to-two sentence paragraphs, inverted pyramid, attribution close to each claim, British spelling, ending with a Sources section listing the real URLs used. The article must reflect the full picture given in the sources, not just the least controversial part of it.

Respond with ONLY this JSON, no other text, no markdown fences:
{
  "found": true,
  "title": "sentence-case headline",
  "standfirst": "one or two sentence summary",
  "category": "one of: general, culture, history, language, community, diaspora",
  "body": "full HTML body using <p>, <h2>, <h3>, <ul><li> tags, ending with a Sources section listing the real URLs"
}

SEARCH RESULTS:
${searchResultsText}`;
'@

$new4 = @'
If none of the results describe a genuine, specific, relevant story, respond with exactly this JSON and nothing else:
{"found": false}

FRESHNESS RULE: Unless the category is "history", the story you choose must describe something that specifically and verifiably happened recently (within about the last 10 days), with a real date, day of the week, or clear recent timeframe stated in the source. Do not select a story just because it was published or indexed recently if the actual event or situation it describes is old, ongoing background, or analysis of something from months or years earlier. If you cannot find a clearly dated, genuinely recent event for a non-history story, respond {"found": false} rather than presenting old context as current news. For "history" category stories, older, well-documented material is fine, but state the historical period or date being discussed.

DATES: Every article must state, in the body text itself, the specific date, day, or clear timeframe when the described event took place, drawn directly from the source (for example "On Friday, the World Health Organization said..." or "On 17 September, ..."). Never leave a news story without a specific time reference - this is a core requirement for a complete article, not optional detail.

COMPLETENESS IS A FACTUAL-ACCURACY REQUIREMENT, NOT A STYLE CHOICE. If the source material you draw from contains serious findings - human rights allegations, casualties, deaths, war crimes findings, criminal conduct, displacement, or other significant harms - connected to the subject of your article, you MUST include them, even if the main angle of the story is something else (such as a territorial gain, an appointment, or an achievement). Omitting documented serious harm while reporting only a neutral or positive framing of the same subject is a factual-completeness failure, not an acceptable editorial choice. When in doubt, include more from the source rather than less.

If you find a genuine story, write it in BBC News house style: sentence-case headline, tight one-to-two sentence paragraphs, inverted pyramid, attribution close to each claim, British spelling, ending with a Sources section listing the real URLs used. The article must reflect the full picture given in the sources, not just the least controversial part of it.

IMAGE SELECTION: Below the search results is a list of real candidate images found alongside them. If, and only if, one of these images clearly and specifically depicts the story you are writing about (matching its description to the subject), select its exact URL as the cover image. Never guess or select an image that is only loosely related, generic, or unrelated (such as a stock photo, an unrelated location, or a different story). If no candidate image clearly matches, set coverImageUrl to null - do not force a mismatched image onto the story.

Respond with ONLY this JSON, no other text, no markdown fences:
{
  "found": true,
  "title": "sentence-case headline",
  "standfirst": "one or two sentence summary",
  "category": "one of: general, culture, history, language, community, diaspora",
  "body": "full HTML body using <p>, <h2>, <h3>, <ul><li> tags, with specific dates stated in the text, ending with a Sources section listing the real URLs",
  "coverImageUrl": "the exact URL of a clearly matching candidate image, or null if none match",
  "coverImageCredit": "the publication or website name the image came from (based on its domain), or null",
  "coverImageCaption": "a short, factual caption describing what the image shows, or null"
}

SEARCH RESULTS:
${searchResultsText}

CANDIDATE IMAGES:
${imageCandidatesText}`;
'@

if ($content.Contains($old4)) {
    $content = $content.Replace($old4, $new4)
    Write-Host "APPLIED (4/6) - Added date/freshness requirements and image-selection instructions to the prompt" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED (4/6) - text not found" -ForegroundColor Red
}

# ===== Fix 5: save the selected cover image fields when inserting the draft =====
$old5 = @'
        title: parsed.title,
        standfirst: parsed.standfirst || null,
        body: parsed.body,
        category,
        author_id: adminProfile.id,
        status: "pending",
'@

$new5 = @'
        title: parsed.title,
        standfirst: parsed.standfirst || null,
        body: parsed.body,
        category,
        author_id: adminProfile.id,
        cover_image_url: parsed.coverImageUrl || null,
        image_credit: parsed.coverImageCredit || null,
        image_caption: parsed.coverImageCaption || null,
        status: "pending",
'@

if ($content.Contains($old5)) {
    $content = $content.Replace($old5, $new5)
    Write-Host "APPLIED (5/6) - Draft now saves the selected cover image, credit, and caption" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED (5/6) - text not found" -ForegroundColor Red
}

# ===== Fix 6: show image candidates in debug mode too =====
$old6 = @'
      return NextResponse.json({
        debug: true,
        searchResultsCount: allResults.length,
        searchResults: allResults,
        groqDecision: parsed,
      });
'@

$new6 = @'
      return NextResponse.json({
        debug: true,
        searchResultsCount: allResults.length,
        searchResults: allResults,
        imageCandidatesCount: allImages.length,
        imageCandidates: allImages,
        groqDecision: parsed,
      });
'@

if ($content.Contains($old6)) {
    $content = $content.Replace($old6, $new6)
    Write-Host "APPLIED (6/6) - Debug mode now shows image candidates too" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED (6/6) - text not found" -ForegroundColor Red
}

[System.IO.File]::WriteAllText($FullPath, $content)

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Require dates and recency in drafts; select real matching cover images from sources'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
