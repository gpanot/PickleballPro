/**
 * Canonical skill taxonomy helpers.
 *
 * Single source of truth for skill IDs, names, and metadata derived from
 * Commun_skills_tags.json. Import from here instead of importing the JSON
 * directly in feature code.
 *
 * Sport-aware entry points:
 *   getSportSkills(sportId)  — flat skill list for any sport
 *   getSportGroups(sportId)  — grouped skills for any sport
 */
import skillsData from '../data/Commun_skills_tags.json';
import { getSport } from './sportConfig';

// ─── Internal flat list (computed once per sport) ─────────────────────────────

const _flatSkillsCache = {};

function flatSkillsForData(data) {
  const result = [];
  for (const [groupKey, group] of Object.entries(data.skillCategories || {})) {
    for (const skill of group.skills || []) {
      result.push({ ...skill, groupKey, groupName: group.name });
    }
  }
  return result;
}

function flatSkills() {
  if (!_flatSkillsCache._default) {
    _flatSkillsCache._default = flatSkillsForData(skillsData);
  }
  return _flatSkillsCache._default;
}

// ─── Sport-aware helpers ──────────────────────────────────────────────────────

/**
 * Get the skill data object (same shape as Commun_skills_tags.json) for a sport.
 */
export function getSportSkillsData(sportId) {
  const sport = getSport(sportId);
  return sport.skillsData ? sport.skillsData() : skillsData;
}

/**
 * Return all skills as a flat array for the given sport.
 */
export function getSportSkills(sportId) {
  const cacheKey = sportId || 'pickleball';
  if (!_flatSkillsCache[cacheKey]) {
    _flatSkillsCache[cacheKey] = flatSkillsForData(getSportSkillsData(sportId));
  }
  return _flatSkillsCache[cacheKey];
}

/**
 * Return skill groups for a given sport.
 */
export function getSportGroups(sportId) {
  const data = getSportSkillsData(sportId);
  return Object.entries(data.skillCategories || {}).map(([key, group]) => ({
    key,
    name: group.name,
    skills: group.skills || [],
  }));
}

// ─── Public API (pickleball / legacy) ─────────────────────────────────────────

/**
 * All skills as a flat array. Each entry has the full JSON shape plus
 * `groupKey` ('technical' | 'movement' | 'strategic' | 'physical') and
 * `groupName` (display label like 'Technical Skills').
 */
export function getAllSkills() {
  return flatSkills();
}/**
 * Find a single skill by its `id` field (e.g. 'serves', 'dinks').
 * Returns undefined if not found.
 */
export function findSkillById(skillId) {
  return flatSkills().find(s => s.id === skillId);
}

/**
 * Return the display name for a skill ID (e.g. 'serves' → 'Serves').
 * Returns the raw ID if the skill is not in the taxonomy.
 */
export function getSkillLabel(skillId) {
  return findSkillById(skillId)?.name ?? skillId;
}

/**
 * Return the colour for a skill ID (for chip styling).
 * Falls back to a neutral grey.
 */
export function getSkillColor(skillId) {
  return findSkillById(skillId)?.color ?? '#6B7280';
}

/**
 * Build the chip option objects consumed by the multi-select grid in admin modals.
 * Shape: { id, name, color, category, groupKey, groupName }
 *
 * Optionally filter to a specific groupKey, e.g. 'technical'.
 */
export function buildSkillChipOptions(groupKeyFilter = null) {
  return flatSkills()
    .filter(s => !groupKeyFilter || s.groupKey === groupKeyFilter)
    .map(s => ({
      id: s.id,
      name: s.name,
      color: s.color,
      category: s.category,
      groupKey: s.groupKey,
      groupName: s.groupName,
    }));
}

/**
 * All distinct skill groups in order: technical, movement, strategic, physical.
 * Each entry: { key, name, skills[] }
 */
export function getSkillGroups() {
  return Object.entries(skillsData.skillCategories || {}).map(([key, group]) => ({
    key,
    name: group.name,
    skills: buildSkillChipOptions(key),
  }));
}
