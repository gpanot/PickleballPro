# Program → Routine → Exercise JSON Import Format

Use this document to author programs as JSON and push them to Supabase.

**Hierarchy**

```
Program (programs)
 └── Routine[] (routines)          — ordered sessions within a program
      └── Exercise[] (exercises)   — linked via routine_exercises junction table
```

---

## Canonical JSON shape

Top-level object = one program.

```json
{
  "name": "Master the Soft Game (4 weeks)",
  "description": "Focus on dinking, drop shots, and net play fundamentals",
  "category": "Fundamentals",
  "tier": "Intermediate",
  "rating": 4.5,
  "added_count": 0,
  "is_published": true,
  "thumbnail_url": null,
  "is_shareable": true,
  "visibility": "public",
  "is_coach_program": false,
  "skill_categories_json": ["dinks", "drops", "volleys"],
  "order_index": 0,
  "routines": [
    {
      "name": "Session A — Dinking Focus",
      "description": "Build consistency and accuracy in dinking exchanges",
      "order_index": 1,
      "time_estimate_minutes": 30,
      "is_published": true,
      "exercises": [
        {
          "code": "1.1",
          "order_index": 1,
          "custom_target_value": 20,
          "is_optional": false
        },
        {
          "order_index": 2,
          "custom_target_value": 10,
          "is_optional": false,
          "exercise": {
            "code": "prog_a_dink_move",
            "title": "Dink & Move",
            "description": "Dink while moving laterally",
            "goal_text": "10 lateral dinks each side",
            "instructions": "1. Start at NVZ\n2. Dink cross-court while sliding laterally\n3. Complete 10 reps per side",
            "target_value": 10,
            "target_unit": "shots",
            "difficulty": 3,
            "estimated_minutes": 10,
            "skill_category": "dinks",
            "skill_categories_json": ["dinks", "footwork", "positioning"],
            "dupr_range_min": 3.0,
            "dupr_range_max": 4.0,
            "tips_json": ["Stay low through the slide", "Soft hands on contact"],
            "is_published": true
          }
        }
      ]
    }
  ]
}
```

---

## Exercise reference modes

Each item in `routines[].exercises[]` must resolve to a row in `exercises`. Use **one** of:

| Mode | When to use | Required fields |
|------|-------------|-----------------|
| **Reference existing** | Exercise already in DB | `code` (unique exercise code, e.g. `"1.1"`) |
| **Inline create** | New exercise | nested `exercise` object with at least `code` + `title` |

Junction fields (always on the routine-exercise link, not on the exercise row):

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `order_index` | integer | yes | 1-based position in the routine |
| `custom_target_value` | integer | no | Overrides `exercises.target_value` for this routine only |
| `is_optional` | boolean | no | Default `false` |

---

## Field reference

### Program (`programs`)

| JSON field | DB column | Type | Required | Notes |
|------------|-----------|------|----------|-------|
| `name` | `name` | string | yes | |
| `description` | `description` | string | no | |
| `category` | `category` | string | yes | e.g. `"Pro Training"`, `"Fundamentals"`, `"Custom"` |
| `tier` | `tier` | string | no | `"Beginner"`, `"Intermediate"`, `"Advanced"`, `"Elite"` |
| `rating` | `rating` | number | no | 0–5, default `0` |
| `added_count` | `added_count` | integer | no | Library popularity counter |
| `is_published` | `is_published` | boolean | no | Must be `true` to appear in Explore/Library |
| `thumbnail_url` | `thumbnail_url` | string | no | Public URL |
| `is_shareable` | `is_shareable` | boolean | no | Default `true` |
| `visibility` | `visibility` | string | no | `"public"` or `"private"` |
| `is_coach_program` | `is_coach_program` | boolean | no | `true` = hidden from public Library |
| `skill_categories_json` | `skill_categories_json` | string[] | no | Skill IDs from taxonomy (see below) |
| `order_index` | `order_index` | integer | no | Sort order in Explore |

### Routine (`routines`)

| JSON field | DB column | Type | Required | Notes |
|------------|-----------|------|----------|-------|
| `name` | `name` | string | yes | |
| `description` | `description` | string | no | |
| `order_index` | `order_index` | integer | yes | Unique per program, 1-based |
| `time_estimate_minutes` | `time_estimate_minutes` | integer | no | Total session duration |
| `is_published` | `is_published` | boolean | no | |

### Exercise (`exercises`)

| JSON field | DB column | Type | Required | Notes |
|------------|-----------|------|----------|-------|
| `code` | `code` | string | yes | **Globally unique** (e.g. `"1.1"`, `"ben1.2"`, `"prog_a_dink_move"`) |
| `title` | `title` | string | yes | Display name |
| `description` | `description` | string | no | Short summary |
| `goal_text` | `goal_text` | string | no | Success criteria shown to player |
| `instructions` | `instructions` | string | no | Step-by-step (plain text or markdown) |
| `target_value` | `target_value` | integer | no | Numeric goal (e.g. `20`) |
| `target_unit` | `target_unit` | string | no | e.g. `"shots"`, `"seconds"`, `"percent"`, `"attempts"` |
| `target_type` | `target_type` | string | no | `"count"`, `"streak"`, `"percent"`, `"passfail"`, `"time"` |
| `difficulty` | `difficulty` | integer | no | 1–5 |
| `estimated_minutes` | `estimated_minutes` | integer | no | Per-exercise duration |
| `skill_category` | `skill_category` | string | no | Comma-separated legacy field |
| `skill_categories_json` | `skill_categories_json` | string[] | no | Preferred — use skill IDs |
| `dupr_range_min` | `dupr_range_min` | number | no | e.g. `2.5` |
| `dupr_range_max` | `dupr_range_max` | number | no | e.g. `4.0` |
| `tips_json` | `tips_json` | string[] | no | Coaching tips |
| `demo_video_url` | `demo_video_url` | string | no | YouTube or hosted video URL |
| `thumbnail_url` | `thumbnail_url` | string | no | |
| `requires_coach` | `requires_coach` | boolean | no | |
| `tier_level` | `tier_level` | string | no | `"Beginner"`, `"Intermediate"`, `"Advanced"`, `"Pro"` |
| `is_published` | `is_published` | boolean | no | Must be `true` for AI generator / Explore matching |

**Display target in app:** `"${custom_target_value || target_value} ${target_unit}"`  
Example: `20` + `"shots"` → `"20 shots"`

---

## Valid skill IDs (`skill_categories_json`)

From `src/data/Commun_skills_tags.json`:

**Technical:** `dinks`, `drives`, `serves`, `returns`, `volleys`, `lobs`, `drops`, `resets`, `third_shot`, `smashes`, `slices`, `spin_control`, `rolls`, `flicks`, `putaways`, `defensive_saves`, `erne`, `atp`

**Movement:** `footwork`, `positioning`, `transitions`

**Strategic:** `game_play`, `patterns`, `communication`, `pressure_points`, `poaching`, `disguise`

**Physical:** `conditioning`

---

## DB insert order

Import scripts should follow the same order as `saveAIProgram` in `src/lib/aiProgramGenerator.js`:

```
1. INSERT program          → get program.id
2. For each routine:
     INSERT routine        → get routine.id
3. For each exercise in routine:
     a. If code exists in exercises table → reuse exercise.id
     b. Else INSERT exercise              → get exercise.id
     c. INSERT routine_exercises (routine_id, exercise_id, order_index, ...)
```

### Supabase RPCs (authenticated app user)

| Step | RPC | Key params |
|------|-----|------------|
| Program | `create_program_as_user` | `program_name`, `program_description`, `program_category`, `program_tier`, `program_is_published`, `program_thumbnail_url`, `program_skill_categories_json` |
| Program (admin) | `create_program_as_admin` | Same + `program_rating`, `program_added_count` |
| Routine | `create_routine_as_user` | `routine_program_id`, `routine_name`, `routine_description`, `routine_order_index`, `routine_time_estimate_minutes`, `routine_is_published` |
| Exercise | `create_exercise_as_user_with_duplicate_check` | `exercise_code`, `exercise_title`, `exercise_description`, `exercise_instructions`, `exercise_goal`, `exercise_difficulty`, `exercise_target_value`, `exercise_target_unit`, `exercise_estimated_minutes`, `exercise_skill_category`, `exercise_skill_categories_json`, `exercise_is_published` |
| Link | direct insert | `routine_exercises`: `{ routine_id, exercise_id, order_index, custom_target_value?, is_optional? }` |

### Direct SQL / service-role alternative

```sql
-- 1. Program
INSERT INTO programs (name, description, category, tier, is_published, skill_categories_json)
VALUES (...) RETURNING id;

-- 2. Routine
INSERT INTO routines (program_id, name, description, order_index, time_estimate_minutes, is_published)
VALUES (...) RETURNING id;

-- 3. Exercise (skip if code already exists)
INSERT INTO exercises (code, title, goal_text, instructions, target_value, target_unit, difficulty, skill_categories_json, is_published)
VALUES (...) RETURNING id;

-- 4. Junction
INSERT INTO routine_exercises (routine_id, exercise_id, order_index, custom_target_value, is_optional)
VALUES (...);
```

---

## Minimal example (1 program, 1 routine, 2 exercises)

```json
{
  "name": "Beginner Basics",
  "description": "Core fundamentals for new players",
  "category": "Fundamentals",
  "tier": "Beginner",
  "is_published": true,
  "routines": [
    {
      "name": "Session 1 — Serve & Return",
      "description": "Learn consistent serves and deep returns",
      "order_index": 1,
      "time_estimate_minutes": 45,
      "exercises": [
        {
          "order_index": 1,
          "exercise": {
            "code": "bb_serve_deep",
            "title": "Deep Serve Mastery",
            "goal_text": "7/10 serves in back third",
            "instructions": "Stand behind baseline. Aim for the back third of the service box. Use 75% power.",
            "target_value": 7,
            "target_unit": "shots",
            "difficulty": 2,
            "estimated_minutes": 12,
            "skill_categories_json": ["serves"],
            "dupr_range_min": 2.0,
            "dupr_range_max": 3.5,
            "is_published": true
          }
        },
        {
          "order_index": 2,
          "exercise": {
            "code": "bb_return_deep",
            "title": "Deep Return Practice",
            "goal_text": "7/10 returns past midline",
            "instructions": "Return every serve deep. Focus on consistency over winners.",
            "target_value": 7,
            "target_unit": "shots",
            "difficulty": 2,
            "estimated_minutes": 15,
            "skill_categories_json": ["returns"],
            "dupr_range_min": 2.0,
            "dupr_range_max": 3.5,
            "is_published": true
          }
        }
      ]
    }
  ]
}
```

---

## Full example (multi-routine, mixed references)

Based on the Ben Johns program CSV structure in `ben_johns_pro_training_program_level1to5_ALLOWED_TAGS.csv`:

```json
{
  "name": "Program A: Pro Foundations",
  "description": "Build core soft-game and serve/return fundamentals",
  "category": "Pro Training",
  "tier": "Intermediate",
  "rating": 4.8,
  "is_published": true,
  "skill_categories_json": ["dinks", "serves", "returns", "third_shot"],
  "routines": [
    {
      "name": "Routine 1: Dink Mastery",
      "description": "NVZ dinking consistency and movement",
      "order_index": 1,
      "time_estimate_minutes": 30,
      "exercises": [
        {
          "order_index": 1,
          "exercise": {
            "code": "bj_target_dinks",
            "title": "Target Dinks",
            "goal_text": "20 dinks into box",
            "instructions": "Set targets in NVZ corners. Land 20 dinks in the target zones.",
            "target_value": 20,
            "target_unit": "shots",
            "difficulty": 1,
            "estimated_minutes": 10,
            "skill_categories_json": ["dinks", "spin_control"],
            "dupr_range_min": 2.5,
            "dupr_range_max": 3.5,
            "is_published": true
          }
        },
        {
          "order_index": 2,
          "exercise": {
            "code": "bj_dink_and_move",
            "title": "Dink & Move",
            "goal_text": "10 lateral dinks each side",
            "instructions": "Dink cross-court while sliding laterally. 10 reps per side.",
            "target_value": 10,
            "target_unit": "shots",
            "difficulty": 2,
            "estimated_minutes": 10,
            "skill_categories_json": ["dinks", "footwork", "positioning"],
            "dupr_range_min": 3.0,
            "dupr_range_max": 4.0,
            "is_published": true
          }
        },
        {
          "order_index": 3,
          "exercise": {
            "code": "bj_endurance_rallies",
            "title": "Endurance Rallies",
            "goal_text": "50-ball rally at NVZ",
            "instructions": "Maintain a continuous NVZ dink rally for 50 balls.",
            "target_value": 50,
            "target_unit": "shots",
            "difficulty": 1,
            "estimated_minutes": 10,
            "skill_categories_json": ["conditioning", "dinks"],
            "dupr_range_min": 2.0,
            "dupr_range_max": 8.0,
            "is_published": true
          }
        }
      ]
    },
    {
      "name": "Routine 2: Serve & Return Precision",
      "description": "Serve spin, deep returns, and third-shot drops",
      "order_index": 2,
      "time_estimate_minutes": 35,
      "exercises": [
        {
          "order_index": 1,
          "exercise": {
            "code": "bj_spin_serves",
            "title": "Spin Serves",
            "goal_text": "20 successful spin serves",
            "target_value": 20,
            "target_unit": "shots",
            "difficulty": 2,
            "estimated_minutes": 10,
            "skill_categories_json": ["serves", "spin_control"],
            "dupr_range_min": 3.5,
            "dupr_range_max": 5.0,
            "is_published": true
          }
        },
        {
          "order_index": 2,
          "exercise": {
            "code": "bj_return_deep",
            "title": "Return Deep & Directed",
            "goal_text": "20 deep returns to backhand/middle",
            "target_value": 20,
            "target_unit": "shots",
            "difficulty": 2,
            "estimated_minutes": 10,
            "skill_categories_json": ["returns", "slices", "spin_control", "positioning"],
            "dupr_range_min": 3.0,
            "dupr_range_max": 5.0,
            "is_published": true
          }
        },
        {
          "order_index": 3,
          "exercise": {
            "code": "bj_basic_3rd_drop",
            "title": "Basic 3rd Shot Drop",
            "goal_text": "15 clean drops from baseline",
            "target_value": 15,
            "target_unit": "shots",
            "difficulty": 1,
            "estimated_minutes": 10,
            "skill_categories_json": ["drops", "third_shot", "transitions"],
            "dupr_range_min": 2.0,
            "dupr_range_max": 3.0,
            "is_published": true
          }
        }
      ]
    }
  ]
}
```

---

## CSV → JSON mapping

If you start from a spreadsheet like `ben_johns_pro_training_program_level1to5_ALLOWED_TAGS.csv`:

| CSV column | JSON destination |
|------------|------------------|
| `Program` | `name` (group rows into one program object) |
| `Routine` | `routines[].name` |
| `Exercise Name` | `exercise.title` |
| `Level` | `exercise.difficulty` |
| `Range` | parse `"2.5–3.5"` → `dupr_range_min` / `dupr_range_max` |
| `Duration (min)` | `exercise.estimated_minutes` |
| `Target` | `exercise.goal_text` (+ parse number into `target_value` if possible) |
| `Tags` | `exercise.skill_categories_json` (map display names → skill IDs) |

---

## Validation checklist

- [ ] `programs.name` is non-empty
- [ ] `programs.category` is set
- [ ] Each routine has a unique `order_index` within the program
- [ ] Each exercise link has `order_index` (1-based, no gaps recommended)
- [ ] Every `exercise.code` is globally unique across the `exercises` table
- [ ] `difficulty` is 1–5
- [ ] `dupr_range_min` ≤ `dupr_range_max` when both set
- [ ] `is_published: true` on program + exercises if importing to Explore/Library
- [ ] `skill_categories_json` uses IDs from the taxonomy (not display names like `"Dinks"`)

---

## Related files

| File | Purpose |
|------|---------|
| `src/lib/aiProgramGenerator.js` | `saveAIProgram()` — reference import implementation |
| `src/lib/userProgramsApi.js` | RPC wrappers for program/routine CRUD |
| `src/lib/supabase.js` | `getPrograms()`, `getProgramDetails()`, `transformProgramData()` |
| `src/data/Commun_skills_tags.json` | Canonical skill ID list |
| `ben_johns_pro_training_program_level1to5_ALLOWED_TAGS.csv` | Example source data |
| `PROGRAMS_ROUTINES_EXERCISES_DATA.md` | Older schema notes + exercise library tables |
