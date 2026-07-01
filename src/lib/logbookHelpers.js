// Helpers for the logbook redesign.
// Pure functions — no React, no side effects.

import skillsData from '../data/Commun_skills_tags.json';

export const CAL_PER_HOUR = 450;

// Build skill id → display label map from taxonomy
const skillLabelMap = {};
Object.values(skillsData.skillCategories).forEach(category => {
  category.skills.forEach(skill => {
    skillLabelMap[skill.id] = skill.name;
    skillLabelMap[skill.name.toLowerCase()] = skill.name;
  });
});

const SKILL_ALIASES = {
  drop_shot: 'drops',
  drop_shots: 'drops',
  'drop shot': 'drops',
  'drop shots': 'drops',
  third_shot: 'third_shot',
  '3rd shot': 'third_shot',
  '3rd Shot': 'third_shot',
};

export function getSkillLabel(id) {
  if (!id) return '';
  const raw = String(id).trim();
  const normalized = raw.toLowerCase();
  const alias = SKILL_ALIASES[normalized] || SKILL_ALIASES[raw];
  if (alias && skillLabelMap[alias]) return skillLabelMap[alias];
  if (skillLabelMap[raw]) return skillLabelMap[raw];
  if (skillLabelMap[normalized]) return skillLabelMap[normalized];
  return raw
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Coerce hours/feeling from DB (may arrive as string, null, or duration_minutes).
export function parseEntryHours(hours, durationMinutes) {
  const fromHours = Number(hours);
  if (Number.isFinite(fromHours) && fromHours > 0) return fromHours;
  const mins = Number(durationMinutes);
  if (Number.isFinite(mins) && mins > 0) return Math.round((mins / 60) * 10) / 10;
  return 0;
}

export function parseEntryFeeling(feeling) {
  const n = Number(feeling);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? n : 3;
}

// Parse YYYY-MM-DD without timezone shift.
export function parseEntryDate(dateString) {
  if (!dateString) return new Date();
  if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    const [y, m, d] = dateString.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0);
  }
  return new Date(dateString);
}

// Activity (training/social/class) + format (single/double) from stored entry.
export function getActivityAndFormat(entry) {
  const type = entry?.sessionType || 'social';
  if (type === 'single' || type === 'double') {
    return { activity: 'social', format: type };
  }
  const loc = entry?.location;
  if (loc === 'single' || loc === 'double') {
    return { activity: type, format: loc };
  }
  return { activity: type, format: 'double' };
}

// Maps existing 1-5 feeling values to redesign mood labels and semantic colors.
export function feelingToMood(feeling) {
  const map = {
    1: { key: 'struggling', label: 'Rough',  color: '#EF4444' },
    2: { key: 'difficult',  label: 'Hard',   color: '#F97316' },
    3: { key: 'neutral',    label: 'OK',     color: '#94A3B8' },
    4: { key: 'good',       label: 'Good',   color: '#22C55E' },
    5: { key: 'excellent',  label: 'Great',  color: '#8B5CF6' },
  };
  return map[feeling] || map[3];
}

// Returns "Thu, Jun 26" style from an ISO date string.
export function formatSessionDate(dateString) {
  const date = new Date(dateString + 'T12:00:00');
  const day = date.toLocaleDateString('en-US', { weekday: 'short' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const dayNum = date.getDate();
  return `${day}, ${month} ${dayNum}`;
}

// Full date: "Jun 10, 2025"
export function formatFullDate(dateString) {
  const date = new Date(dateString + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Returns current month name + year: "June 2026"
export function getCurrentMonthLabel() {
  const now = new Date();
  return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Display label for session types used in the app.
export function getSessionTypeLabel(sessionType) {
  const labels = {
    training: 'Training',
    social:   'Social',
    class:    'Class',
    single:   'Singles',
    double:   'Doubles',
  };
  return labels[sessionType] || sessionType || 'Training';
}

// Trend sentence: true if the last session feeling >= the one before it.
export function isMoodTrendingUp(last5Entries) {
  if (!last5Entries || last5Entries.length < 2) return false;
  const last = last5Entries[last5Entries.length - 1];
  const prev = last5Entries[last5Entries.length - 2];
  return last.feeling >= prev.feeling;
}

// Builds the last5Moods array (oldest → newest) for the timeline component.
export function buildLast5Moods(entries) {
  const sorted = [...entries].sort((a, b) => new Date(b.date) - new Date(a.date));
  const last5 = sorted.slice(0, 5).reverse();
  return last5.map(entry => feelingToMood(entry.feeling));
}
