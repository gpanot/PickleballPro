#!/usr/bin/env node
/**
 * Generates idempotent SQL to import a program JSON file into Supabase.
 * Usage: node scripts/import-program-json.mjs Free_programs/program_foo.json
 */

import fs from 'fs';
import path from 'path';

const file = process.argv[2];
if (!file) {
  console.error('Usage: node scripts/import-program-json.mjs <path-to-json>');
  process.exit(1);
}

const program = JSON.parse(fs.readFileSync(path.resolve(file), 'utf8'));

function dq(tag, value) {
  if (value == null) return 'NULL';
  const s = String(value);
  let safeTag = tag;
  while (s.includes(`$${safeTag}$`)) safeTag = `${tag}_${Math.random().toString(36).slice(2, 6)}`;
  return `$${safeTag}$${s}$${safeTag}$`;
}

function jsonb(value) {
  return `'${JSON.stringify(value ?? []).replace(/'/g, "''")}'::jsonb`;
}

function num(value) {
  return value == null ? 'NULL' : Number(value);
}

function bool(value) {
  return value ? 'true' : 'false';
}

const routines = program.routines || [];
const exerciseRows = [];
const links = [];

for (const routine of routines) {
  for (const item of routine.exercises || []) {
    const ex = item.exercise;
    if (!ex?.code || !ex?.title) {
      throw new Error(`Missing exercise code/title in routine "${routine.name}"`);
    }
    exerciseRows.push(ex);
    links.push({
      routine_key: routine.order_index,
      code: ex.code,
      order_index: item.order_index,
      custom_target_value: item.custom_target_value ?? null,
      is_optional: item.is_optional ?? false,
    });
  }
}

const exerciseInserts = exerciseRows.map((ex) => {
  const skills = ex.skill_categories_json || [];
  const skillCategory = ex.skill_category || skills.join(',');
  return `(
    ${dq(`code_${ex.code}`, ex.code)},
    ${dq(`title_${ex.code}`, ex.title)},
    ${dq(`desc_${ex.code}`, ex.description || '')},
    ${dq(`goal_${ex.code}`, ex.goal_text || '')},
    ${dq(`inst_${ex.code}`, ex.instructions || '')},
    ${ex.target_type ? dq(`tt_${ex.code}`, ex.target_type) : 'NULL'},
    ${num(ex.target_value)},
    ${ex.target_unit ? dq(`tu_${ex.code}`, ex.target_unit) : 'NULL'},
    ${num(ex.difficulty)},
    ${num(ex.estimated_minutes)},
    ${jsonb(skills)},
    ${dq(`sc_${ex.code}`, skillCategory)},
    ${num(ex.dupr_range_min)},
    ${num(ex.dupr_range_max)},
    ${jsonb(ex.tips_json || [])},
    ${ex.demo_video_url ? dq(`vid_${ex.code}`, ex.demo_video_url) : 'NULL'},
    ${bool(ex.is_published)},
    ${ex.tier_level ? dq(`tl_${ex.code}`, ex.tier_level) : 'NULL'}
  )`;
}).join(',\n');

const linkValues = links.map((l) => `(
  ${num(l.routine_key)},
  ${dq(`lcode_${l.routine_key}_${l.order_index}`, l.code)},
  ${num(l.order_index)},
  ${l.custom_target_value == null ? 'NULL' : num(l.custom_target_value)},
  ${bool(l.is_optional)}
)`).join(',\n');

const sql = `DO $$
DECLARE
  v_program_id uuid;
BEGIN
  SELECT id INTO v_program_id
  FROM public.programs
  WHERE name = ${dq('pname', program.name)}
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_program_id IS NULL THEN
    INSERT INTO public.programs (
      name, description, category, tier, rating, added_count, is_published,
      thumbnail_url, is_shareable, visibility, is_coach_program,
      skill_categories_json, order_index
    ) VALUES (
      ${dq('pname', program.name)},
      ${dq('pdesc', program.description || '')},
      ${dq('pcat', program.category)},
      ${dq('ptier', program.tier || 'Beginner')},
      ${num(program.rating ?? 0)},
      ${num(program.added_count ?? 0)},
      ${bool(program.is_published ?? false)},
      ${program.thumbnail_url ? dq('pthumb', program.thumbnail_url) : 'NULL'},
      ${bool(program.is_shareable !== false)},
      ${dq('pvis', program.visibility || 'public')},
      ${bool(program.is_coach_program ?? false)},
      ${jsonb(program.skill_categories_json || [])},
      ${num(program.order_index ?? 0)}
    )
    RETURNING id INTO v_program_id;
  ELSE
    UPDATE public.programs SET
      description = ${dq('pdesc', program.description || '')},
      category = ${dq('pcat', program.category)},
      tier = ${dq('ptier', program.tier || 'Beginner')},
      rating = ${num(program.rating ?? 0)},
      added_count = ${num(program.added_count ?? 0)},
      is_published = ${bool(program.is_published ?? false)},
      thumbnail_url = ${program.thumbnail_url ? dq('pthumb', program.thumbnail_url) : 'NULL'},
      is_shareable = ${bool(program.is_shareable !== false)},
      visibility = ${dq('pvis', program.visibility || 'public')},
      is_coach_program = ${bool(program.is_coach_program ?? false)},
      skill_categories_json = ${jsonb(program.skill_categories_json || [])},
      order_index = ${num(program.order_index ?? 0)},
      updated_at = now()
    WHERE id = v_program_id;

    DELETE FROM public.routines WHERE program_id = v_program_id;
  END IF;

  CREATE TEMP TABLE tmp_import_routines (
    order_index int PRIMARY KEY,
    routine_id uuid
  ) ON COMMIT DROP;

${routines.map((r) => `  INSERT INTO public.routines (program_id, name, description, order_index, time_estimate_minutes, is_published)
  VALUES (
    v_program_id,
    ${dq(`rname_${r.order_index}`, r.name)},
    ${dq(`rdesc_${r.order_index}`, r.description || '')},
    ${num(r.order_index)},
    ${num(r.time_estimate_minutes)},
    ${bool(r.is_published ?? true)}
  );
  INSERT INTO tmp_import_routines (order_index, routine_id)
  VALUES (${num(r.order_index)}, (SELECT id FROM public.routines WHERE program_id = v_program_id AND order_index = ${num(r.order_index)} ORDER BY created_at DESC LIMIT 1));
`).join('\n')}

  INSERT INTO public.exercises (
    code, title, description, goal_text, instructions,
    target_type, target_value, target_unit, difficulty, estimated_minutes,
    skill_categories_json, skill_category, dupr_range_min, dupr_range_max,
    tips_json, demo_video_url, is_published, tier_level
  ) VALUES
  ${exerciseInserts}
  ON CONFLICT (code) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    goal_text = EXCLUDED.goal_text,
    instructions = EXCLUDED.instructions,
    target_type = EXCLUDED.target_type,
    target_value = EXCLUDED.target_value,
    target_unit = EXCLUDED.target_unit,
    difficulty = EXCLUDED.difficulty,
    estimated_minutes = EXCLUDED.estimated_minutes,
    skill_categories_json = EXCLUDED.skill_categories_json,
    skill_category = EXCLUDED.skill_category,
    dupr_range_min = EXCLUDED.dupr_range_min,
    dupr_range_max = EXCLUDED.dupr_range_max,
    tips_json = EXCLUDED.tips_json,
    demo_video_url = EXCLUDED.demo_video_url,
    is_published = EXCLUDED.is_published,
    tier_level = EXCLUDED.tier_level,
    updated_at = now();

  INSERT INTO public.routine_exercises (routine_id, exercise_id, order_index, custom_target_value, is_optional)
  SELECT tr.routine_id, e.id, l.order_index, l.custom_target_value, l.is_optional
  FROM (VALUES
    ${linkValues}
  ) AS l(routine_order_index, exercise_code, order_index, custom_target_value, is_optional)
  JOIN tmp_import_routines tr ON tr.order_index = l.routine_order_index
  JOIN public.exercises e ON e.code = l.exercise_code
  ON CONFLICT (routine_id, exercise_id) DO UPDATE SET
    order_index = EXCLUDED.order_index,
    custom_target_value = EXCLUDED.custom_target_value,
    is_optional = EXCLUDED.is_optional;
END $$;`;

console.log(sql);
