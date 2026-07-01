// Single source of truth for all logbook content.
// Both V1 (Sport Dark) and V2 (Warm & Friendly) import from here.
// Only themes differ between versions — never content.

export const CAL_PER_HOUR = 450;

export const SESSIONS = [
  {
    id: 1,
    date: "Jun 26",
    day: "Thu",
    hours: 3,
    type: "Social",
    format: "Doubles",
    mood: "difficult" as const,
    strong: ["Dinks", "Returns", "Drives"],
    challenging: ["Drop Shots", "Volleys", "Dinks"],
  },
  {
    id: 2,
    date: "Jun 25",
    day: "Wed",
    hours: 1,
    type: "Class",
    format: "Singles",
    mood: "neutral" as const,
    strong: ["Dinks", "Serves"],
    challenging: ["Drop Shots", "3rd Shot"],
  },
  {
    id: 3,
    date: "Jun 22",
    day: "Sun",
    hours: 1,
    type: "Training",
    format: "Singles",
    mood: "good" as const,
    strong: ["Returns", "Slices"],
    challenging: ["Drop Shots", "Footwork"],
  },
];

export const TOTAL_HOURS = SESSIONS.reduce((s, x) => s + x.hours, 0); // 5
export const TOTAL_SESSIONS = SESSIONS.length;                         // 3
export const TOTAL_CALORIES = TOTAL_HOURS * CAL_PER_HOUR;             // 2250

// Only types with hours > 0
export const SESSION_TYPE_BREAKDOWN = [
  { label: "Social",   hours: 4 },
  { label: "Class",    hours: 1 },
];

export const PIE_DATA = SESSION_TYPE_BREAKDOWN.map((s) => ({ name: s.label, value: s.hours }));

export const TOP_STRONG = [
  { name: "Dinks",   count: 2 },
  { name: "Returns", count: 2 },
  { name: "Drives",  count: 1 },
];

export const TOP_CHALLENGING = [
  { name: "Drop Shots", count: 3 },
  { name: "Dinks",      count: 1 },
  { name: "Volleys",    count: 1 },
];

// Last 5 sessions oldest → newest (includes prior sessions for trend)
export type MoodKey = "struggling" | "difficult" | "neutral" | "good" | "excellent";

export const MOOD_TREND: Array<{ mood: MoodKey; label: string }> = [
  { mood: "struggling", label: "Rough" },
  { mood: "difficult",  label: "Hard"  },
  { mood: "difficult",  label: "Hard"  },
  { mood: "neutral",    label: "OK"    },
  { mood: "good",       label: "Good"  },
];

// Universal semantic colors — same in both themes for immediate legibility
export const MOOD_COLOR: Record<MoodKey, string> = {
  struggling: "#EF4444",
  difficult:  "#F97316",
  neutral:    "#94A3B8",
  good:       "#22C55E",
  excellent:  "#8B5CF6",
};

export const COACH_INSIGHT = {
  skill: "Drop Shots",
  sessions: 3,
  text: "Drop shots have been your toughest challenge for 3 sessions in a row. A focused lesson could unlock a real breakthrough.",
};
