import { supabase } from './supabase';
import { findSkillById as taxonomyFindSkillById, getAllSkills } from './skillTaxonomy';

// ─── RPC wrappers ────────────────────────────────────────────────────────────

/**
 * Fetches all active (non-archived) training tracks for the current user.
 * Returns programs with full routine+exercise trees via the DB RPC.
 */
export async function getActiveTrainingTracks() {
  const { data, error } = await supabase.rpc('get_active_training_tracks');
  if (error) throw error;
  // Normalise routines from JSONB → JS array
  return (data || []).map(row => ({
    enrollmentId: row.enrollment_id,
    trackRole: row.track_role,
    accessType: row.access_type,
    addedAt: row.added_at,
    lastAccessedAt: row.last_accessed_at,
    currentRoutineId: row.current_routine_id,
    completionPercentage: row.completion_percentage,
    program: {
      id: row.program_id,
      name: row.program_name,
      description: row.program_description,
      category: row.program_category,
      tier: row.program_tier,
      thumbnail_url: row.program_thumbnail_url,
      rating: row.program_rating,
      skill_categories_json: row.program_skill_categories_json || [],
      routines: row.routines || [],
    },
  }));
}

/**
 * Enroll in a program as a specific track role.
 * Automatically archives any existing occupant of that slot.
 * @param {string} programId
 * @param {'primary'|'skill_1'|'skill_2'} trackRole
 */
export async function setActiveTrack(programId, trackRole) {
  const { data, error } = await supabase.rpc('set_active_track', {
    p_program_id: programId,
    p_track_role: trackRole,
  });
  if (error) throw error;
  return data;
}

/**
 * Archive a track (clears track_role, sets archived_at).
 * @param {string} programId
 */
export async function archiveActiveTrack(programId) {
  const { error } = await supabase.rpc('archive_active_track', {
    p_program_id: programId,
  });
  if (error) throw error;
}

/**
 * Save-only: add to collection without a track_role (no tab switch).
 * Uses direct upsert on user_programs.
 * @param {string} programId
 * @param {string} userId
 */
export async function saveForLater(programId, userId) {
  const { error } = await supabase
    .from('user_programs')
    .upsert(
      { user_id: userId, program_id: programId, access_type: 'added', added_at: new Date().toISOString() },
      { onConflict: 'user_id,program_id' }
    );
  if (error) throw error;
}

/**
 * Update the resume pointer when a user opens a session.
 * @param {string} programId
 * @param {string} routineId
 */
export async function updateTrainingResume(programId, routineId) {
  const { error } = await supabase.rpc('update_training_resume', {
    p_program_id: programId,
    p_routine_id: routineId,
  });
  if (error) console.warn('updateTrainingResume error:', error);
}

// ─── DUPR / skill matchers ────────────────────────────────────────────────────

const ROAD_CATEGORIES = ['DUPR Path', 'dupr_path'];
// Legacy category values kept only as fallback for programs not yet tagged
const LEGACY_SKILL_CATEGORIES = ['Skill Focus', 'skill_focus'];

/**
 * Parse the numeric DUPR target from a program name like "Road to 4.0".
 * Returns null if no number found.
 */
function parseDuprTarget(name = '') {
  const match = name.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

/**
 * Given the user's current DUPR rating and a list of all published programs,
 * returns the single best-match "Road to X" program.
 *
 * Logic: pick the program with the smallest target ≥ userDupr.
 * Fallback: highest tier ≤ user level (i.e. the ceiling).
 *
 * @param {number|null} userDupr
 * @param {Array} allPrograms - raw programs from getPrograms()
 * @returns {Object|null}
 */
export function matchRoadToXProgram(userDupr, allPrograms) {
  const roadPrograms = allPrograms.filter(p =>
    ROAD_CATEGORIES.includes(p.category) ||
    (p.name || '').toLowerCase().startsWith('road to')
  );

  if (!roadPrograms.length) return null;
  if (!userDupr) return roadPrograms[0]; // no DUPR? return first available

  const withTargets = roadPrograms
    .map(p => ({ p, target: parseDuprTarget(p.name) }))
    .filter(({ target }) => target !== null);

  // Smallest target that is still above current DUPR
  const above = withTargets
    .filter(({ target }) => target > userDupr)
    .sort((a, b) => a.target - b.target);

  if (above.length) return above[0].p;

  // Fallback: highest target ≤ user DUPR (ceiling already reached, show highest)
  const atOrBelow = withTargets
    .filter(({ target }) => target <= userDupr)
    .sort((a, b) => b.target - a.target);

  return atOrBelow.length ? atOrBelow[0].p : roadPrograms[0];
}

// ─── Onboarding program matcher ──────────────────────────────────────────────

/**
 * Maps the user's onboarding goal + DUPR rating to a recommended free program
 * and up to 2 alternatives from the published program catalog.
 *
 * @param {{ goal: string, duprRating: number|null, allPrograms: Array }} params
 * @returns {{ recommended: Object|null, alternatives: Array }}
 */
export function matchProgramsForOnboarding({ goal, duprRating, allPrograms }) {
  // First try DUPR-path matcher for the 'dupr' goal (no-ops today if no DUPR Path programs)
  if (goal === 'dupr') {
    const duprMatch = matchRoadToXProgram(duprRating, allPrograms);
    if (duprMatch) {
      const alternatives = allPrograms
        .filter(p => p.id !== duprMatch.id)
        .slice(0, 2);
      return { recommended: duprMatch, alternatives };
    }
  }

  // Name-keyword maps per goal — ordered by preference
  const KEYWORD_MAP = {
    dupr:        ['foundation', 'beginner', 'fundamentals', 'road', 'basics', 'novice'],
    basics:      ['foundation', 'fundamentals', 'basics', 'beginner', 'novice'],
    consistency: ['dink', 'volley', 'consistency', 'control', 'mastery'],
    tournament:  ['competitive', 'tournament', 'advanced', 'edge', 'serve', 'pro'],
  };

  const keywords = KEYWORD_MAP[goal] || KEYWORD_MAP['basics'];

  // Score each program by how many keywords appear in name+description (case-insensitive)
  const scored = allPrograms.map(p => {
    const searchable = `${p.name || ''} ${p.description || ''}`.toLowerCase();
    const score = keywords.filter(kw => searchable.includes(kw)).length;
    return { program: p, score };
  });

  // Sort by score descending; fall back to catalog order
  scored.sort((a, b) => b.score - a.score);

  const recommended = scored[0]?.program || allPrograms[0] || null;
  const alternatives = scored
    .slice(1, 3)
    .map(s => s.program)
    .filter(Boolean);

  return { recommended, alternatives };
}

// ─── Program skill normalisation ─────────────────────────────────────────────

/**
 * Returns the skill tag IDs on a program as a plain string array.
 * Handles both the new JSONB column and edge cases where the value arrives
 * as a serialised string from Supabase.
 */
export function normalizeProgramSkills(program) {
  const raw = program?.skill_categories_json;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  return [];
}

/**
 * Returns true when a program is eligible for the My Training Skill Focus slot.
 * Tag-first: programs that carry explicit skill tags.
 * Legacy fallback: old `Skill Focus` / `skill_focus` category programmes
 * that haven't been backfilled yet.
 */
export function isSkillEligibleProgram(program) {
  if (normalizeProgramSkills(program).length > 0) return true;
  // Legacy fallback
  return (
    LEGACY_SKILL_CATEGORIES.includes(program?.category) ||
    (program?.category || '').toLowerCase().includes('skill')
  );
}

/**
 * Returns all programs that are eligible as a skill focus track.
 * (Replaces the old `getAllSkillFocusPrograms`; export alias kept for back-compat.)
 */
export function getSkillEligiblePrograms(allPrograms) {
  return (allPrograms || []).filter(isSkillEligibleProgram);
}

/** @deprecated Use getSkillEligiblePrograms instead */
export const getAllSkillFocusPrograms = getSkillEligiblePrograms;

/**
 * Returns all programs tagged with a specific skill ID.
 * For programs not yet tagged, falls back to the legacy fuzzy-name match.
 *
 * @param {string} skillId - e.g. 'serves', 'dinks'
 * @param {Array}  allPrograms
 * @returns {Array}
 */
export function getProgramsForSkill(skillId, allPrograms) {
  const tagged = (allPrograms || []).filter(p => {
    const tags = normalizeProgramSkills(p);
    return tags.includes(skillId);
  });
  if (tagged.length > 0) return tagged;

  // Legacy fuzzy fallback for un-tagged programs
  const skill = taxonomyFindSkillById(skillId);
  const searchTerms = [
    skillId?.toLowerCase(),
    skill?.name?.toLowerCase(),
    ...(skill?.tags || []),
  ].filter(Boolean);

  return (allPrograms || []).filter(p => {
    if (!isSkillEligibleProgram(p)) return false;
    const searchable = [p.name, p.description, ...(Array.isArray(p.tags) ? p.tags : [])]
      .join(' ')
      .toLowerCase();
    return searchTerms.some(t => searchable.includes(t));
  });
}

/** @deprecated Use getProgramsForSkill instead */
export const matchSkillFocusPrograms = getProgramsForSkill;

/**
 * Builds the list for the My Training skill picker step 1.
 * Returns skills that have ≥1 eligible published program, in taxonomy order.
 *
 * @param {Array} allPrograms - published programs from catalog
 * @returns {Array<{ skill: Object, programs: Array }>}
 */
export function getSkillsWithPrograms(allPrograms) {
  const allSkills = getAllSkills();
  return allSkills
    .map(skill => ({
      skill,
      programs: getProgramsForSkill(skill.id, allPrograms),
    }))
    .filter(entry => entry.programs.length > 0);
}
