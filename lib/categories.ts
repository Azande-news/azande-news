export const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "culture", label: "Culture" },
  { value: "history", label: "History" },
  { value: "language", label: "Zande Language" },
  { value: "diaspora", label: "Diaspora" },
  { value: "community", label: "Community" },
  { value: "announcements", label: "Announcements" },
] as const;

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);
