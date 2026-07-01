/**
 * Canonical skill taxonomy helpers.
 *
 * Single source of truth for skill IDs, names, and metadata derived from
 * Commun_skills_tags.json. Import from here instead of importing the JSON
 * directly in feature code.
 */
import skillsData from '../data/Commun_skills_tags.json';

// ─── Internal flat list (computed once) ──────────────────────────────────────

let _flatSkills = null;

function flatSkills() {
  if (_flatSkills) return _flatSkills;
  const result = [];
  for (const [groupKey, group] of Object.entries(skillsData.skillCategories || {})) {
    for (const skill of group.skills || []) {
      result.push({ ...skill, groupKey, groupName: group.name });
    }
  }
  _flatSkills = result;
  return result;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * All skills as a flat array. Each entry has the full JSON shape plus
 * `groupKey` ('technical' | 'movement' | 'strategic' | 'physical') and
 * `groupName` (display label like 'Technical Skills').
 */
export function getAllSkills() {
  return flatSkills();
}

/**
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
