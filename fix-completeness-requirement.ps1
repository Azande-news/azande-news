cd "$HOME\Downloads\azande-news"

$FilePath = "app\api\cron\weekly-news\route.ts"
$FullPath = (Resolve-Path -LiteralPath $FilePath).Path
$content = [System.IO.File]::ReadAllText($FullPath)

$old = @'
Below are REAL web search results from this week. Use ONLY the information in these results. Do not add any fact, name, date, or detail that is not present in them - if it is not in the results, it does not go in the article.

Look for ONE genuine, specific news story clearly relevant to the Azande people or their regions (Western Equatoria, Yambio, Haut-Uele, Bas-Uele, or the Azande diaspora), fitting one of these categories: general, culture, history, language, community, diaspora.

If none of the results describe a genuine, specific, relevant story, respond with exactly this JSON and nothing else:
{"found": false}

If you find one, write it in BBC News house style: sentence-case headline, tight one-to-two sentence paragraphs, inverted pyramid, attribution close to each claim, British spelling, ending with a Sources section listing the real URLs used.
'@

$new = @'
Below are REAL web search results from this week. Use ONLY the information in these results. Do not add any fact, name, date, or detail that is not present in them - if it is not in the results, it does not go in the article.

Look for ONE genuine, specific news story clearly relevant to the Azande people or their regions (Western Equatoria, Yambio, Haut-Uele, Bas-Uele, or the Azande diaspora), fitting one of these categories: general, culture, history, language, community, diaspora.

If none of the results describe a genuine, specific, relevant story, respond with exactly this JSON and nothing else:
{"found": false}

COMPLETENESS IS A FACTUAL-ACCURACY REQUIREMENT, NOT A STYLE CHOICE. If the source material you draw from contains serious findings - human rights allegations, casualties, deaths, war crimes findings, criminal conduct, displacement, or other significant harms - connected to the subject of your article, you MUST include them, even if the main angle of the story is something else (such as a territorial gain, an appointment, or an achievement). Omitting documented serious harm while reporting only a neutral or positive framing of the same subject is a factual-completeness failure, not an acceptable editorial choice. When in doubt, include more from the source rather than less.

If you find a genuine story, write it in BBC News house style: sentence-case headline, tight one-to-two sentence paragraphs, inverted pyramid, attribution close to each claim, British spelling, ending with a Sources section listing the real URLs used. The article must reflect the full picture given in the sources, not just the least controversial part of it.
'@

if ($content.Contains($old)) {
    $updated = $content.Replace($old, $new)
    [System.IO.File]::WriteAllText($FullPath, $updated)
    Write-Host "APPLIED - Added permanent completeness requirement: serious findings (harm, casualties, allegations) must be included, not omitted" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED - could not find expected text. No changes made." -ForegroundColor Red
}

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Require complete, honest coverage of serious findings in AI-drafted articles, not just the convenient framing'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
