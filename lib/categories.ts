export const CATEGORIES = [
  { value: "general", label: "Local News", description: "Everyday happenings in your area" },
  { value: "culture", label: "Culture", description: "Traditions, food, celebrations, daily life" },
  { value: "history", label: "History", description: "Azande history and historical figures" },
  { value: "language", label: "Zande Language", description: "The Zande language and its use" },
  { value: "diaspora", label: "Diaspora", description: "Azande life outside DR Congo, South Sudan, and CAR" },
  { value: "community", label: "Community", description: "Groups, organizations, and community efforts" },
  { value: "announcements", label: "Notices", description: "Official updates, events, and notices" },
] as const;

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

export const CATEGORY_DESCRIPTIONS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.description])
);
