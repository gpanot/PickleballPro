import { supabase, getPrograms } from './supabase';
import skillsData from '../data/Commun_skills_tags.json';

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
const SKILL_CATEGORIES = ['Skill Focus', 'skill_focus'];

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

/**
 * Given a skill ID (from Commun_skills_tags.json) or skill name and a list of programs,
 * returns all matching Skill Focus programs.
 *
 * @param {string} skillId - e.g. 'dinks', 'serves'
 * @param {Array} allPrograms
 * @returns {Array}
 */
export function matchSkillFocusPrograms(skillId, allPrograms) {
  const skill = findSkillById(skillId);
  const searchTerms = [
    skillId?.toLowerCase(),
    skill?.name?.toLowerCase(),
    ...(skill?.tags || []),
  ].filter(Boolean);

  return allPrograms.filter(p => {
    const isSkillCategory =
      SKILL_CATEGORIES.includes(p.category) ||
      (p.category || '').toLowerCase().includes('skill');

    if (!isSkillCategory) return false;

    const searchable = [
      p.name,
      p.description,
      ...(Array.isArray(p.tags) ? p.tags : []),
    ]
      .join(' ')
      .toLowerCase();

    return searchTerms.some(t => searchable.includes(t));
  });
}

/**
 * Returns all Skill Focus programs grouped loosely by their skill category.
 */
export function getAllSkillFocusPrograms(allPrograms) {
  return allPrograms.filter(p =>
    SKILL_CATEGORIES.includes(p.category) ||
    (p.category || '').toLowerCase().includes('skill')
  );
}

function findSkillById(skillId) {
  for (const category of Object.values(skillsData.skillCategories || {})) {
    const skill = (category.skills || []).find(s => s.id === skillId);
    if (skill) return skill;
  }
  return null;
}
