cd "$HOME\Downloads\azande-news"

function Normalize-LF([string]$s) { return ($s -replace "`r`n", "`n") }

function Apply-Patch {
    param([string]$Path, [string]$Old, [string]$New, [string]$Marker, [string]$Label)

    $full = (Resolve-Path -LiteralPath $Path).Path
    $raw = [System.IO.File]::ReadAllText($full)
    $crlf = $raw.Contains("`r`n")
    $work = Normalize-LF $raw

    if ($work.Contains((Normalize-LF $Marker))) {
        Write-Host "ALREADY APPLIED - $Label" -ForegroundColor Yellow
        return
    }

    $o = Normalize-LF $Old
    $n = Normalize-LF $New
    $idx = $work.IndexOf($o, [System.StringComparison]::Ordinal)
    if ($idx -lt 0) {
        Write-Host "NOT APPLIED - $Label (expected text not found; no change made)" -ForegroundColor Red
        return
    }

    $work = $work.Substring(0, $idx) + $n + $work.Substring($idx + $o.Length)
    if ($crlf) { $work = $work -replace "`n", "`r`n" }
    [System.IO.File]::WriteAllText($full, $work)
    Write-Host "APPLIED - $Label" -ForegroundColor Green
}

$f = "lib\news-agent.ts"
if (-not (Test-Path -LiteralPath $f)) { Write-Host "STOP - $f not found. Run this from the azande-news folder after syncing with GitHub." -ForegroundColor Red; return }

$helperNew = @'
function matches(text: string, re: RegExp): string[] {
  const found = text.match(re);
  return found ? Array.from(found) : [];
}

function stripTags(html: string): string {
'@

Apply-Patch -Path $f -Old 'function stripTags(html: string): string {' -New $helperNew -Marker 'function matches(text: string' -Label "Added a type-safe text matcher"
Apply-Patch -Path $f -Old 'return (text.toLowerCase().match(/[a-zà-ÿ0-9]{5,}/g) ?? []).map((w) => w.slice(0, 5));' -New 'return matches(text.toLowerCase(), /[a-zà-ÿ0-9]{5,}/g).map((w) => w.slice(0, 5));' -Marker 'matches(text.toLowerCase()' -Label "Word stems use the safe matcher"
Apply-Patch -Path $f -Old 'return (text.match(/\d[\d,]*\d|\d/g) ?? []).map((n) => n.replace(/,/g, ""));' -New 'return matches(text, /\d[\d,]*\d|\d/g).map((n) => n.replace(/,/g, ""));' -Marker 'matches(text, /\d[\d,]*\d' -Label "Number check uses the safe matcher"
Apply-Patch -Path $f -Old 'const sentences = stripTags(html).match(/[^.!?]+[.!?]+/g) ?? [];' -New 'const sentences = matches(stripTags(html), /[^.!?]+[.!?]+/g);' -Marker 'matches(stripTags(html)' -Label "Sentence splitting uses the safe matcher (this was the line that broke the build)"
Apply-Patch -Path $f -Old 'const tags = html.match(/<meta\b[^>]*>/gi) ?? [];' -New 'const tags = matches(html, /<meta\b[^>]*>/gi);' -Marker 'matches(html, /<meta' -Label "Photo lookup uses the safe matcher"

Write-Host ""
Write-Host "Remaining unsafe patterns in the file (should be 0):" -ForegroundColor Cyan
(Select-String -Path $f -Pattern '\.match\(.*\?\? \[\]' | Measure-Object).Count
