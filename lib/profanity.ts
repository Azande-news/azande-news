const BAD_WORDS = [
  "fuck", "shit", "bitch", "asshole", "bastard", "cunt", "dick", "piss",
  "slut", "whore", "nigger", "nigga", "faggot", "retard", "cock", "twat",
];

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PATTERN = new RegExp(
  `\\b(${BAD_WORDS.map(escapeRegex).join("|")})\\b`,
  "gi"
);

export function censorText(text: string): string {
  return text.replace(PATTERN, (match) => "*".repeat(match.length));
}

export function containsProfanity(text: string): boolean {
  PATTERN.lastIndex = 0;
  return PATTERN.test(text);
}
