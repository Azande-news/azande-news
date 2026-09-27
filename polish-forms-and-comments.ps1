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

# ===== Fix A: SearchBox.tsx - align focus state with established convention =====
$searchBoxOld = @'
        className="flex-1 min-w-0 border border-border rounded-sm px-3 py-1.5 text-sm text-ink bg-paper placeholder-grey focus:outline-none focus:border-accent"
'@

$searchBoxNew = @'
        className="flex-1 min-w-0 border border-border px-3 py-1.5 text-sm text-ink bg-paper placeholder-grey focus:outline-none focus:border-ink"
'@

Apply-Fix -FilePath "components\SearchBox.tsx" `
    -OldText $searchBoxOld `
    -NewText $searchBoxNew `
    -Description "Aligned SearchBox focus state with established convention (border-ink, not accent red)"

# ===== Fix B: CommentSection.tsx - use SmartTime instead of raw date formatting =====
$commentImportOld = @'
import { createClient } from "@/lib/supabase/client";
import { censorText } from "@/lib/profanity";
'@

$commentImportNew = @'
import { createClient } from "@/lib/supabase/client";
import { censorText } from "@/lib/profanity";
import SmartTime from "@/components/SmartTime";
'@

Apply-Fix -FilePath "components\CommentSection.tsx" `
    -OldText $commentImportOld `
    -NewText $commentImportNew `
    -Description "Added SmartTime import to CommentSection"

$commentTimeOld = @'
              <span className="font-meta text-xs text-grey">
                {new Date(c.created_at).toLocaleDateString()}
              </span>
'@

$commentTimeNew = @'
              <span className="font-meta text-xs text-grey">
                <SmartTime iso={c.created_at} />
              </span>
'@

Apply-Fix -FilePath "components\CommentSection.tsx" `
    -OldText $commentTimeOld `
    -NewText $commentTimeNew `
    -Description "Replaced raw date formatting with SmartTime (matches PostCard, article page, breaking bar)"

# ===== Fix C: CommentSection.tsx - align textarea focus state with established convention =====
$commentTextareaOld = @'
            className="w-full border border-border rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-accent"
'@

$commentTextareaNew = @'
            className="w-full border border-border px-3 py-2 font-body focus:outline-none focus:border-ink"
'@

Apply-Fix -FilePath "components\CommentSection.tsx" `
    -OldText $commentTextareaOld `
    -NewText $commentTextareaNew `
    -Description "Aligned comment textarea focus state with established convention (border-ink, not accent ring)"

Write-Host ""
Write-Host "Done. Review with 'git diff', then commit and push:" -ForegroundColor Cyan
Write-Host "  git diff" -ForegroundColor White
Write-Host "  git add ." -ForegroundColor White
Write-Host "  git commit -m 'Polish: consistent focus states and SmartTime usage in SearchBox and CommentSection'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
