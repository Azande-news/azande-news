cd "$HOME\Downloads\azande-news"

$sql = @'
-- Add a standfirst column: the bold one-line summary BBC shows
-- between a headline and the byline. Nullable, optional per post.
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS standfirst text;
'@

Set-Content -Path "standfirst-migration.sql" -Value $sql -Encoding utf8
notepad "standfirst-migration.sql"
