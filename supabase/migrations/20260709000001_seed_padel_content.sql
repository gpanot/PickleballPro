-- ============================================================
-- Padel Content Seed
-- Creates exercises, programs, and assessment templates for Padel.
-- All rows are isolated from pickleball via sport_id FK.
-- ============================================================

DO $$
DECLARE
  padel_id        uuid;
  prog_fundamentals_id uuid;
  prog_power_id   uuid;
BEGIN
  SELECT id INTO padel_id FROM public.sports WHERE slug = 'padel';

  -- ── 1. Exercises ──────────────────────────────────────────────────────────

  INSERT INTO public.exercises
    (id, code, title, description, difficulty, skill_category, tier_level,
     dupr_range_min, dupr_range_max, tags, is_published, sport_id)
  VALUES
    -- Beginner exercises
    (gen_random_uuid(), 'PDL_SRV_01', 'Basic Padel Serve',
     'Learn the foundational padel serve: continental grip, toss, swing. Focus on consistency over power.',
     1, 'technical', 'Beginner',
     1.0, 3.5, '["serve","technical","beginner"]'::jsonb, true, padel_id),

    (gen_random_uuid(), 'PDL_VOL_01', 'Forehand Volley',
     'Punch volley drill near the net. Short backswing, meet the ball in front, aim for cross-court placement.',
     1, 'technical', 'Beginner',
     1.0, 3.5, '["volley","technical","beginner"]'::jsonb, true, padel_id),

    (gen_random_uuid(), 'PDL_LOB_01', 'Defensive Lob',
     'High lob to push opponents back from the net. Emphasise height over the glass to force a bajada situation.',
     2, 'technical', 'Beginner',
     1.0, 4.0, '["lob","technical","defensive"]'::jsonb, true, padel_id),

    -- Intermediate exercises
    (gen_random_uuid(), 'PDL_BAN_01', 'Bandeja Drill',
     'The essential padel overhead — slice the ball into the glass at a controlled angle. Practice trajectory control.',
     3, 'technical', 'Intermediate',
     3.5, 6.0, '["bandeja","technical","intermediate"]'::jsonb, true, padel_id),

    (gen_random_uuid(), 'PDL_WAL_01', 'Back-Wall Rally',
     'Rally using back glass rebounds. Learn to time and redirect wall shots with topspin or slice.',
     3, 'strategic', 'Intermediate',
     3.5, 6.0, '["wall_shot","strategic","intermediate"]'::jsonb, true, padel_id),

    (gen_random_uuid(), 'PDL_VIB_01', 'Víbora Introduction',
     'The aggressive topspin overhead used to finish points at the net. Requires hip rotation and proper contact point.',
     4, 'technical', 'Advanced',
     5.5, 8.0, '["vibora","technical","advanced"]'::jsonb, true, padel_id),

    (gen_random_uuid(), 'PDL_LAT_01', 'Lateral Shuffle Drill',
     'Side-to-side footwork drill across the court width. Build explosive lateral recovery speed.',
     2, 'physical', 'Beginner',
     1.0, 4.0, '["lateral","physical","movement"]'::jsonb, true, padel_id),

    (gen_random_uuid(), 'PDL_NET_01', 'Net Attack Patterns',
     'Three-shot net attack: volley cross-court, volley body, volley side-glass. Drill to recognise attack windows.',
     3, 'strategic', 'Intermediate',
     3.5, 6.5, '["net_game","attack_patterns","strategic"]'::jsonb, true, padel_id)
  ON CONFLICT (code) DO NOTHING;

  -- ── 2. Programs ───────────────────────────────────────────────────────────

  prog_fundamentals_id := gen_random_uuid();
  prog_power_id        := gen_random_uuid();

  INSERT INTO public.programs
    (id, name, description, category, tier, skill_categories_json,
     is_published, is_featured, program_type, sport_id)
  VALUES
    (prog_fundamentals_id,
     'Padel Fundamentals',
     'A structured 4-week beginner program covering serve, volley, lob, and court movement. Perfect for players new to padel or under level 3.5.',
     'Beginner',
     'Beginner',
     '{"categories": ["technical", "physical"], "primarySkills": ["serve", "volley", "lob", "lateral"]}'::jsonb,
     true, true, 'coach', padel_id),

    (prog_power_id,
     'Padel Power Game',
     'An intermediate program focused on net dominance and aggressive shot patterns — bandeja, víbora, and back-wall play. Recommended for players level 3.5–6.',
     'Intermediate',
     'Intermediate',
     '{"categories": ["technical", "strategic"], "primarySkills": ["bandeja", "vibora", "wall_shot", "net_game"]}'::jsonb,
     true, true, 'coach', padel_id);

  -- ── 3. Assessment templates ───────────────────────────────────────────────

  -- Experience assessment (has the player ever played padel?)
  INSERT INTO public.assessment_templates
    (type, name, description, template, is_default, academy_id, sport_id)
  VALUES
    ('experience',
     'Padel Experience Assessment',
     'Branching questionnaire to assess a new padel student''s background and experience level.',
     '{
       "questions": [
         {
           "id": "playedPadel",
           "question": "Have you ever played Padel?",
           "type": "button",
           "condition": null,
           "options": [{"label": "Yes", "value": "yes"}, {"label": "No", "value": "no"}]
         },
         {
           "id": "sportDuration",
           "question": "For how long have you been playing padel?",
           "type": "button",
           "condition": {"key": "playedPadel", "value": "yes"},
           "options": [
             {"label": "Less than 6 months", "value": "less6months"},
             {"label": "6 months – 2 years",  "value": "6months_2years"},
             {"label": "More than 2 years",   "value": "more2years"}
           ]
         },
         {
           "id": "racketBackground",
           "question": "Have you played any racket sport before?",
           "type": "button",
           "condition": {"key": "playedPadel", "value": "no"},
           "options": [
             {"label": "Tennis",        "value": "tennis"},
             {"label": "Squash",        "value": "squash"},
             {"label": "Badminton",     "value": "badminton"},
             {"label": "Table Tennis",  "value": "table_tennis"},
             {"label": "None",          "value": "none"}
           ]
         }
       ]
     }'::jsonb,
     true, null, padel_id),

    -- Player evaluation (scored skill assessment for padel)
    ('player_evaluation',
     'Padel Player Assessment',
     'Scored evaluation of core padel skills using sliders for each sub-criterion.',
     '{
       "skills": [
         {
           "id": "serve",
           "name": "Serve",
           "maxScore": 30,
           "criteria": [
             {"id": "consistency", "label": "Consistency",    "maxScore": 10},
             {"id": "placement",   "label": "Placement",      "maxScore": 10},
             {"id": "variation",   "label": "Spin/Slice Variation", "maxScore": 10}
           ]
         },
         {
           "id": "volleys",
           "name": "Volleys",
           "maxScore": 30,
           "criteria": [
             {"id": "technique",  "label": "Technique",       "maxScore": 10},
             {"id": "placement",  "label": "Placement",       "maxScore": 10},
             {"id": "reaction",   "label": "Reaction Speed",  "maxScore": 10}
           ]
         },
         {
           "id": "overheads",
           "name": "Overheads (Bandeja/Víbora)",
           "maxScore": 30,
           "criteria": [
             {"id": "bandeja",   "label": "Bandeja Control",  "maxScore": 10},
             {"id": "vibora",    "label": "Víbora Timing",    "maxScore": 10},
             {"id": "selection", "label": "Shot Selection",   "maxScore": 10}
           ]
         },
         {
           "id": "wall_play",
           "name": "Wall Play",
           "maxScore": 30,
           "criteria": [
             {"id": "back_glass",  "label": "Back Glass",   "maxScore": 10},
             {"id": "side_glass",  "label": "Side Glass",   "maxScore": 10},
             {"id": "transition",  "label": "Transition",   "maxScore": 10}
           ]
         },
         {
           "id": "movement",
           "name": "Movement & Positioning",
           "maxScore": 20,
           "criteria": [
             {"id": "lateral",     "label": "Lateral Speed",   "maxScore": 10},
             {"id": "positioning", "label": "Court Positioning","maxScore": 10}
           ]
         }
       ]
     }'::jsonb,
     true, null, padel_id);

END $$;
