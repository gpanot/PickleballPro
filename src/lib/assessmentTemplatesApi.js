import { supabase } from './supabase';
import { getSport } from './sportConfig';

// ─── Sport UUID resolver ─────────────────────────────────────────────────────

const _sportUuidCache = {};

/**
 * Resolve a sport slug (e.g. 'pickleball') to its UUID in public.sports.
 * Result is cached in-memory for the session lifetime.
 */
async function resolveSportUuid(slug) {
  if (!slug) return null;
  if (_sportUuidCache[slug]) return _sportUuidCache[slug];
  const { data } = await supabase
    .from('sports')
    .select('id')
    .eq('slug', slug)
    .single();
  if (data?.id) _sportUuidCache[slug] = data.id;
  return data?.id ?? null;
}

// ─── Hardcoded fallback defaults ────────────────────────────────────────────
// These mirror the data seeded into assessment_templates. Used when the
// Supabase fetch fails (offline, permissions, etc.) so coach screens never
// break.

/**
 * Build a default experience template for a given sport.
 * The first question is pulled from sport config so it is sport-agnostic.
 * Falls back to pickleball if sportId is unknown.
 */
export function getDefaultExperienceTemplate(sportId) {
  const config = getSport(sportId).assessmentConfig;
  const firstQ = config.firstQuestion;
  const qId = firstQ.id;
  return {
    questions: [
      firstQ,
      {
        id: 'sportDuration',
        question: config.durationLabel ?? 'For how long have you been playing?',
        type: 'button',
        condition: { key: qId, value: 'yes' },
        options: [
          { label: 'Less than 6 months', value: 'less6months' },
          { label: 'More than 6 months', value: 'more6months' },
        ],
      },
      {
        id: 'racketSport',
        question: 'Have you ever played any racket sport?',
        type: 'button',
        condition: { key: qId, value: 'no' },
        options: [
          { label: 'Tennis', value: 'tennis' },
          { label: 'Badminton', value: 'badminton' },
          { label: 'Ping Pong', value: 'pingpong' },
          { label: 'Squash', value: 'squash' },
          { label: 'None', value: 'none' },
        ],
      },
      {
        id: 'racketSkillLevel',
        question: 'How good are you at that sport?',
        type: 'button',
        condition: { key: 'racketSport', notValue: 'none', mustExist: true },
        options: [
          { label: 'Beginner', value: 'beginner' },
          { label: 'Normal', value: 'normal' },
          { label: 'Semi Pro', value: 'semipro' },
          { label: 'Pro Player', value: 'pro' },
        ],
      },
    ],
  };
}

// Backward-compat export (pickleball default)
export const DEFAULT_EXPERIENCE_TEMPLATE = getDefaultExperienceTemplate('pickleball');

export const DEFAULT_PLAYER_EVALUATION_TEMPLATE = {
  skills: [
    {
      id: 'serves',
      name: 'Serves',
      maxScore: 50,
      criteria: [
        { id: 'consistency', label: 'Consistency', maxScore: 10 },
        { id: 'depth_control', label: 'Depth Control', maxScore: 10 },
        { id: 'placement', label: 'Placement Accuracy', maxScore: 10 },
        { id: 'spin', label: 'Spin / Variation', maxScore: 10 },
        { id: 'power_recovery', label: 'Power + Recovery', maxScore: 10 },
      ],
    },
    {
      id: 'dinks',
      name: 'Dinks',
      maxScore: 40,
      criteria: [
        { id: 'consistency', label: 'Consistency', maxScore: 10 },
        { id: 'depth', label: 'Depth Control', maxScore: 10 },
        { id: 'direction', label: 'Direction Control', maxScore: 10 },
        { id: 'pace', label: 'Pace Control', maxScore: 10 },
      ],
    },
    {
      id: 'volleys',
      name: 'Volleys / Resets',
      maxScore: 50,
      criteria: [
        { id: 'consistency', label: 'Consistency', maxScore: 10 },
        { id: 'placement', label: 'Placement', maxScore: 10 },
        { id: 'power', label: 'Power Control', maxScore: 10 },
        { id: 'reset_ability', label: 'Reset Ability', maxScore: 10 },
        { id: 'court_position', label: 'Court Position', maxScore: 10 },
      ],
    },
    {
      id: 'third_shot',
      name: '3rd Shot',
      maxScore: 40,
      criteria: [
        { id: 'placement', label: 'Placement', maxScore: 10 },
        { id: 'consistency', label: 'Consistency', maxScore: 10 },
        { id: 'depth', label: 'Depth Control', maxScore: 10 },
        { id: 'follow_through', label: 'Follow Through', maxScore: 10 },
      ],
    },
    {
      id: 'footwork',
      name: 'Footwork',
      maxScore: 30,
      criteria: [
        { id: 'agility', label: 'Agility', maxScore: 10 },
        { id: 'positioning', label: 'Positioning', maxScore: 10 },
        { id: 'balance', label: 'Balance', maxScore: 10 },
      ],
    },
    {
      id: 'game_play',
      name: 'Game Play / Scenarios',
      maxScore: 40,
      criteria: [
        { id: 'strategy', label: 'Strategy', maxScore: 10 },
        { id: 'adaptability', label: 'Adaptability', maxScore: 10 },
        { id: 'decision_making', label: 'Decision Making', maxScore: 10 },
        { id: 'pressure_handling', label: 'Pressure Handling', maxScore: 10 },
      ],
    },
  ],
};

// ─── Condition evaluator ────────────────────────────────────────────────────
// Converts the serialized condition objects stored in the DB into runtime booleans.
// This replaces the previous inline JS functions in QUESTIONS.
//
// condition shapes:
//   null                               → always shown
//   { key, value }                     → answers[key] === value
//   { key, value: 'no' }               → answers[key] === 'no'
//   { key, notValue, mustExist: true } → answers[key] exists && answers[key] !== notValue

export function evaluateCondition(condition, answers) {
  if (!condition) return true;
  const { key, value, notValue, mustExist } = condition;
  if (mustExist) {
    return !!answers[key] && answers[key] !== notValue;
  }
  return answers[key] === value;
}

// ─── Fetch helpers ──────────────────────────────────────────────────────────

/**
 * Fetches the active template for a given type.
 * Priority: academy-scoped override → global default → hardcoded fallback.
 *
 * @param {'experience'|'player_evaluation'} type
 * @param {string|null} academyId
 * @param {string|null} sportId  — sport slug (e.g. 'pickleball', 'padel')
 * @returns {Promise<object>} The template payload (questions[] or skills[])
 */
export async function getAssessmentTemplate(type, academyId = null, sportId = null) {
  try {
    const sportUuid = sportId ? await resolveSportUuid(sportId) : null;

    // Try academy-scoped first, then fall back to global default
    const queries = [];

    if (academyId) {
      let q = supabase
        .from('assessment_templates')
        .select('id, name, template')
        .eq('type', type)
        .eq('academy_id', academyId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();
      if (sportUuid) q = q.eq('sport_id', sportUuid);
      queries.push(q);
    }

    let globalQ = supabase
      .from('assessment_templates')
      .select('id, name, template')
      .eq('type', type)
      .eq('is_default', true)
      .is('academy_id', null)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();
    if (sportUuid) globalQ = globalQ.eq('sport_id', sportUuid);
    queries.push(globalQ);

    for (const query of queries) {
      const { data, error } = await query;
      if (!error && data?.template) {
        return { id: data.id, name: data.name, ...data.template };
      }
    }
  } catch (err) {
    console.warn('[assessmentTemplatesApi] fetch failed, using fallback:', err?.message);
  }

  // Hardcoded fallback
  if (type === 'experience') return { ...getDefaultExperienceTemplate(sportId || 'pickleball') };
  return { ...DEFAULT_PLAYER_EVALUATION_TEMPLATE };
}

/**
 * Fetches templates for the admin panel list.
 *
 * Scoping rules:
 *   academyId provided  → global defaults (academy_id IS NULL) + academy overrides
 *   academyId null      → global defaults only (superadmin / no-academy context)
 *   showAll = true      → all rows regardless of academy (superadmin view)
 *   sportId provided    → filter to a specific sport slug
 */
export async function listAssessmentTemplates(academyId = null, { showAll = false, sportId = null } = {}) {
  try {
    const sportUuid = sportId ? await resolveSportUuid(sportId) : null;

    let query = supabase
      .from('assessment_templates')
      .select('id, type, name, description, is_default, academy_id, created_at, updated_at')
      .order('type')
      .order('updated_at', { ascending: false });

    if (!showAll) {
      if (academyId) {
        query = query.or(`academy_id.eq.${academyId},academy_id.is.null`);
      } else {
        query = query.is('academy_id', null);
      }
    }

    if (sportUuid) {
      query = query.eq('sport_id', sportUuid);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn('[assessmentTemplatesApi] listAssessmentTemplates failed:', err?.message);
    return [];
  }
}

/**
 * Saves (upsert) a template. Creates a new row if no id is given.
 *
 * is_default must be passed explicitly as true only when a superadmin wants to
 * create/update a global system default. For all coach/manager saves it is false,
 * even when academyId is null (solo coach with no academy).
 */
export async function saveAssessmentTemplate({ id, type, name, description, template, academyId, isDefault = false }) {
  console.log('[assessmentTemplatesApi] saveAssessmentTemplate → id:', id, 'academyId:', academyId, 'isDefault:', isDefault);
  const payload = {
    type,
    name,
    description: description || null,
    template,
    is_default: isDefault,
    academy_id: academyId || null,
  };

  if (id) {
    const { data, error } = await supabase
      .from('assessment_templates')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('assessment_templates')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

/**
 * Deletes a template by id.
 */
export async function deleteAssessmentTemplate(id) {
  console.log('[assessmentTemplatesApi] deleteAssessmentTemplate → id:', id);
  const { data, error } = await supabase
    .from('assessment_templates')
    .delete()
    .eq('id', id)
    .select('id');
  console.log('[assessmentTemplatesApi] delete response → data:', JSON.stringify(data), 'error:', error);
  if (error) throw error;
  if (!data || data.length === 0) {
    console.warn('[assessmentTemplatesApi] ❌ delete returned 0 rows — RLS blocking?');
    throw new Error('Delete was blocked by the database. You may not have permission to delete this template.');
  }
  console.log('[assessmentTemplatesApi] ✅ deleted', data.length, 'row(s)');
}

/**
 * Seeds the two default templates if they don't already exist.
 * Called automatically by AssessmentsPanel when a superadmin sees 0 templates.
 * Checks each type individually and only inserts if missing.
 */
export async function seedDefaultTemplates() {
  const defaults = [
    {
      type: 'experience',
      name: 'Experience Assessment',
      description: "Branching questionnaire to assess a new student's background and experience level.",
      template: getDefaultExperienceTemplate('pickleball'),
      is_default: true,
      academy_id: null,
    },
    {
      type: 'player_evaluation',
      name: 'Player Assessment',
      description: 'Scored evaluation of core pickleball skills using sliders for each sub-criterion.',
      template: DEFAULT_PLAYER_EVALUATION_TEMPLATE,
      is_default: true,
      academy_id: null,
    },
  ];

  for (const row of defaults) {
    // Check if a default of this type already exists
    const { data: existing } = await supabase
      .from('assessment_templates')
      .select('id')
      .eq('type', row.type)
      .eq('is_default', true)
      .is('academy_id', null)
      .maybeSingle();

    if (!existing) {
      const { error } = await supabase
        .from('assessment_templates')
        .insert(row);
      if (error) {
        console.warn('[assessmentTemplatesApi] seedDefaultTemplates insert failed:', error.message);
      }
    }
  }
}
