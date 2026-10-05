cd "$HOME\Downloads\azande-news"

$FilePath = "app\api\cron\weekly-news\route.ts"
$FullPath = (Resolve-Path -LiteralPath $FilePath).Path
$content = [System.IO.File]::ReadAllText($FullPath)

$old = @'
FRESHNESS RULE: Unless the category is "history", the story you choose must describe something that specifically and verifiably happened recently (within about the last 10 days), with a real date, day of the week, or clear recent timeframe stated in the source. Do not select a story just because it was published or indexed recently if the actual event or situation it describes is old, ongoing background, or analysis of something from months or years earlier. If you cannot find a clearly dated, genuinely recent event for a non-history story, respond {"found": false} rather than presenting old context as current news. For "history" category stories, older, well-documented material is fine, but state the historical period or date being discussed.

DATES: Every article must state, in the body text itself, the specific date, day, or clear timeframe when the described event took place, drawn directly from the source (for example "On Friday, the World Health Organization said..." or "On 17 September, ..."). Never leave a news story without a specific time reference - this is a core requirement for a complete article, not optional detail.

COMPLETENESS IS A FACTUAL-ACCURACY REQUIREMENT, NOT A STYLE CHOICE. If the source material you draw from contains serious findings - human rights allegations, casualties, deaths, war crimes findings, criminal conduct, displacement, or other significant harms - connected to the subject of your article, you MUST include them, even if the main angle of the story is something else (such as a territorial gain, an appointment, or an achievement). Omitting documented serious harm while reporting only a neutral or positive framing of the same subject is a factual-completeness failure, not an acceptable editorial choice. When in doubt, include more from the source rather than less.

If you find a genuine story, write it in BBC News house style: sentence-case headline, tight one-to-two sentence paragraphs, inverted pyramid, attribution close to each claim, British spelling, ending with a Sources section listing the real URLs used. The article must reflect the full picture given in the sources, not just the least controversial part of it.
'@

$new = @'
FRESHNESS RULE: Unless the category is "history", the story you choose must describe a specific event with a specific day-level date, day of the week, or clearly recent timeframe (such as "on Friday" or "on 17 September") stated IN THE SOURCE for when that event itself happened - not just when the article was published or indexed. Before selecting a story, explicitly check: does the source give a specific day for the triggering event, or only vague background dates such as when a group "formed in 2023" or received training "in 2024"? Background or founding dates are NOT sufficient to establish freshness. A story that is really ongoing analysis, retrospective, or old context dressed up with a recent publish date must be rejected: respond {"found": false} rather than present it as current news. For "history" category stories, older, well-documented material is fine, but state the historical period or date being discussed.

DATES: Every article must state, in the body text itself, the specific date, day, or clear timeframe when the described event took place, drawn directly from the source (for example "On Friday, the World Health Organization said..." or "On 17 September, ..."). Never leave a news story without a specific time reference - this is a core requirement for a complete article, not optional detail. If you cannot find such a date in the source, that is itself a sign the story fails the freshness rule above.

COMPLETENESS IS A FACTUAL-ACCURACY REQUIREMENT, NOT A STYLE CHOICE. If the source material you draw from contains serious findings - human rights allegations, casualties, deaths, war crimes findings, criminal conduct, displacement, or other significant harms - connected to the subject of your article, you MUST include them, even if the main angle of the story is something else (such as a territorial gain, an appointment, or an achievement). Omitting documented serious harm while reporting only a neutral or positive framing of the same subject is a factual-completeness failure, not an acceptable editorial choice. When in doubt, include more from the source rather than less.

DO NOT SOFTEN OR GENERALIZE DOCUMENTED FINDINGS. If the source names a specific finding - such as a named report or body reaching a specific conclusion, a specific casualty count, a specific documented incident, or a direct quote describing the severity of something - you must state that specific finding, in specific terms, not replace it with a vague generic sentence like "human rights observers have raised concerns" or "could exacerbate tensions." Name who found what, and what exactly was found, as precisely as the source states it.

If you find a genuine story, write it in BBC News house style: sentence-case headline, tight one-to-two sentence paragraphs, inverted pyramid, attribution close to each claim, British spelling, ending with a Sources section listing the real URLs used. The article must reflect the full picture given in the sources, not just the least controversial part of it.

BEFORE YOU FINALIZE: check your own draft against three things - (1) does the body state a specific date or day for the event, (2) if the source names specific serious findings, does your draft name them specifically rather than vaguely, (3) is the coverImageUrl either a genuinely matching real image or null. If any of these fail, fix the draft before responding, or respond {"found": false} if the story cannot meet these requirements.
'@

if ($content.Contains($old)) {
    $updated = $content.Replace($old, $new)
    [System.IO.File]::WriteAllText($FullPath, $updated)
    Write-Host "APPLIED - Tightened freshness detection and completeness specificity requirements, added self-check step" -ForegroundColor Green
} else {
    Write-Host "NOT APPLIED - could not find expected text. No changes made." -ForegroundColor Red
}

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Tighten freshness detection and require naming specific documented findings, not vague paraphrase'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
