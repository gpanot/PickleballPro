# DUPR & AI Training Programs — Product Reference

> **Purpose:** Document what was built for DUPR-based training and AI program generation, so the team can decide what to revive later. This is a **product/features/flows** reference — not a code guide.

**Last updated:** June 2025  
**Current status:** Most of this is **not visible in the app today** (see [Current Status](#current-status-in-the-app-today)).

---

## Overview — Three Related Systems

Pickleball Hero has had **three distinct “personalized program” approaches**, all tied to DUPR in different ways:

| System | Data source | Where it lived | Status today |
|--------|-------------|----------------|--------------|
| **DUPR 2→3 Progression** | Hardcoded curriculum (2.0–3.0) | Program tab → “DUPR 2→3” | **Removed** (Oct 2025) |
| **Onboarding Personal Program** | Hardcoded exercise bank | Onboarding → loading screen | **Partially active** (generates on signup, stored in user context) |
| **AI-Generated Program** | Supabase exercises DB | Program tab → “Programs” | **Built but UI hidden** |

These were never fully merged into one experience — which is partly why the Program screen became crowded and tabs were cut.

---

## 1. DUPR 2→3 Progression Program

### What it was

A **structured skill ladder** that took players from **DUPR 2.0 to 3.0** in **0.1 increments** (11 levels). Each level had a named session, specific drills, unlockable skills, and collectible badges.

This was the tab labeled **“DUPR 2→3”** on the Program screen (originally just **“DUPR”**). It rendered the **Skills Screen** — a self-contained progression experience, not a generic program list.

### User value

- **Clear path:** “I know exactly what to work on to go from 2.x to 3.0.”
- **Gamification:** Badges, level completion, locked/unlocked ratings, progress bar across 11 steps.
- **Skill-focused:** Tap a skill → see drills for your current DUPR step → mark complete → rate how it felt.
- **No coach required:** Self-guided curriculum for recreational players climbing the beginner/intermediate ladder.
- **Tangible milestones:** Completing P-2.0 unlocks “Rookie”; reaching P-3.0 unlocks “Solid 3.0” and “Club Ready” meta-badges.

### Where it lived in the app

```
Bottom tab: Program (Training2)
  └── Sub-tabs (historical):
        • Programs        → custom + AI programs list
        • DUPR 2→3        → Skills Screen  ← THIS FEATURE
        • Library         → CMS programs (added later)
```

**Removed:** October 31, 2025 — `SkillsScreen.js` deleted (~2,750 lines), tab removed when Library was merged into Program screen.

### Core user flow

```
1. Open Program tab → tap "DUPR 2→3"
2. See header: "DUPR Skill Progression — 2.0 → 3.0"
   • Collapsible header with overall progress (X/11 levels completed)
   • Visual progress path across rating steps (2.0, 2.1, … 3.0)
3. Tap a rating step on the path → switch "current rating" focus
4. See skills grid for that rating (only skills that have drills at this level)
   • Locked ratings until previous level is 100% complete
5. Tap a skill → modal with drills for that rating
6. Tap "Mark complete" on a drill → rate how it felt (emoji 1–5)
7. When ALL drills at a rating are complete → level marked done → next rating unlocks
8. Badges auto-unlock (congratulation modal, queued if multiple)
9. Long-press header → reset all DUPR 2–3 progress (hidden power-user action)
```

### Progression rules

| Rule | Behavior |
|------|----------|
| Starting level | 2.0 always unlocked |
| Unlock next level | Complete **100%** of drills at current level |
| Skill visibility | Only skills with drills in the current rating’s program appear |
| Skill levels | Each drill has a level (1–3); skill node shows max level from drills |
| Completion tracking | Local only (AsyncStorage), per device |
| Reset | Long-press “DUPR Skill Progression” header → clears exercises, badges, program progress |

### The 11 DUPR levels (curriculum summary)

Each level = **1 session** with **3–8 drills**. Session theme escalates difficulty and introduces new shot types.

| DUPR | Program ID | Session theme | Drill count | New / emphasized skills |
|------|------------|---------------|-------------|-------------------------|
| **2.0** | P-2.0 | Foundations: Control & Consistency | 3 | Serve, Return, Dink basics |
| **2.1** | P-2.1 | Building Depth & Stability | 5 | + Drive, Reset |
| **2.2** | P-2.2 | Deep Control | 5 | Deep serve/return, cross-court dinks |
| **2.3** | P-2.3 | Consistency Under Structure | 5 | + Volley, Transition (NVZ approach) |
| **2.4** | P-2.4 | Return Targets & NVZ Entry | 4 | Cross-court return, approach footwork |
| **2.5** | P-2.5 | Introduce Third Shot Drop | 5 | **First Drop drills**, reset under pressure |
| **2.6** | P-2.6 | Drop + Drive Choice | 7 | Full toolkit: serve, return, dink, drop, drive, volley, reset |
| **2.7** | P-2.7 | NVZ Rally Strength | 6 | Extended dink rallies (20+), redirect volleys |
| **2.8** | P-2.8 | Introduce Pressure & Speed-ups | 4 | **Speed-up**, counter-volley, pressure dinking |
| **2.9** | P-2.9 | Match-Ready Consistency | 8 | Spin serve, hands battles, **Strategy** basics |
| **3.0** | P-3.0 | 3.0 Readiness Check | 7 | Full match simulation drills, tactical stacking |

**Skills covered across the ladder:** Serve, Return, Dink, Drive, Drop (Third Shot), Volley, Reset, Transition, Speed-up, Strategy.

**Not in the 2→3 matrix (defined in skill tree but rarely drilled until higher levels):** Overheads, Lobs — present in the 12-skill UI tree with 5-level descriptions each, but most drills in 2→3 focus on the core 10 skills above.

### Skill tree (12 skills × 5 levels each)

Each skill had a **5-level mastery ladder** with concrete targets (shown in skill nodes), e.g.:

- **Serve:** 7/10 in play → deep serves → target zones → spin → tactical serving
- **Dinking:** 10 consecutive → 15 cross-court → target cones → win under pressure → variety
- **Third Shot Drop:** 4/10 into NVZ → 6/10 soft → BH targeting → drop/drive mix → under pressure
- **Strategy:** call in/out → communicate targets → cover middle → stacking → tactical shot selection

The drills at each DUPR step mapped to specific levels within these ladders.

### Badge system

Badges lived in `2.0to3.0_badges_matrix.md` (still in repo). Three badge types:

| Type | How unlocked | Examples |
|------|--------------|----------|
| **program_completion** | Finish all drills at that DUPR level | “Rookie” (P-2.0), “Solid 3.0” (P-3.0) |
| **drill_threshold** | Complete drills for a skill at that level (bronze/silver/gold tiers) | “Dink Debut”, “Drop Artist”, “Quick Hands” |
| **skill_collection / meta** | Aggregate achievements at 3.0 | “All-Rounder”, “Club Ready” (session count) |

**Badge celebration flow:** Unlock → congratulation modal → collect → next in queue if multiple.

**Example badges by level:**

- 2.0: Rookie, Dink Debut  
- 2.1: Serve Starter, Reset Beginner  
- 2.5: Drop Artist, Dink Grinder  
- 2.8: Quick Hands, Pressure Dinker  
- 3.0: Solid 3.0, All-Rounder, Club Ready  

### Exercise completion UX

When marking a drill complete, the user rated **how it felt**:

| Emoji | Meaning |
|-------|---------|
| 😭 | Very hard |
| 😔 | Hard |
| 😐 | OK |
| 😊 | Good |
| 🤩 | Great |

This fed a “How you felt” summary on the progress screen (distribution of emoji ratings for the current level).

### Data & persistence

- **All progress stored locally** (AsyncStorage) — not synced to Supabase
- Keys: exercise ratings, collected badges, program progress, header expanded state
- **No link to official DUPR API** — curriculum is aligned to DUPR *levels*, not live rating sync

### Related removed screens

- **BadgesScreen.js** — standalone badge collection view (removed same refactor, Oct 2025)
- Badges were also embedded inside the Skills Screen per rating

---

## 2. Onboarding Personal Program

### What it is

A **4-session starter program** generated automatically at the end of onboarding, before the user enters the main app. Uses a **static exercise bank** in `programGenerator.js` — not the CMS database.

### User value

- **Instant gratification:** “Your program is ready” within ~2.5 seconds of signup
- **Personalized to onboarding answers:** Focus areas + DUPR rating shape which drills appear
- **Low friction:** No button to press — happens automatically during “Building your personal program…” loading screen

### User flow

```
Onboarding:
  Training Goal → Time Commitment → Intensity → Create Account → Sign Up
       ↓
  Program Loading Screen (~2.5s animated)
    Messages cycle:
      • "Analyzing your DUPR rating…"
      • "Locking in your goals…"
      • "Balancing your focus areas…"
      • "Designing your first 3 sessions…"
       ↓
  Program generated → stored in UserContext (personalizedProgram)
       ↓
  User lands on Program tab
```

### Program structure

| Property | Value |
|----------|-------|
| Sessions | **4 routines** (~60 min each) |
| Exercises per session | 3–4 |
| Duration label | ~2 weeks |
| Category | “Personal Training” |

**The 4 session templates:**

1. **Foundation Building** — serves, returns, dinks  
2. **Power & Precision** — drives, volleys, serves  
3. **Net Game Mastery** — dinks, volleys, resets  
4. **Complete Game Integration** — drops, lobs, resets  

User’s **focus areas** (from onboarding) are prioritized; template skills fill gaps.

### Difficulty scaling (by DUPR)

| DUPR range | Tier | Max exercise difficulty |
|------------|------|-------------------------|
| &lt; 2.5 | Beginner | 3 |
| 2.5 – 3.5 | Intermediate | 4 |
| ≥ 3.5 | Advanced | 5 |

Default focus areas if none selected: `dinks, serves, returns, volleys`.

### Exercise bank (static)

Hardcoded drills per skill category — 2–3 exercises each for: dinks, drives, serves, returns, volleys, lobs, drops, resets. Each has title, goal, instructions, target type (count/streak), difficulty, time estimate.

### Where the program goes after generation

- Stored in **UserContext** as `user.personalizedProgram`
- Previously also shown via **PersonalizedProgramCard** at top of Programs tab (removed Sept 2025 when AI generator was added)
- **Not automatically saved to Supabase** as a full program record in the current flow

### Status today

- **ProgramLoadingScreen + programGenerator still exist** and run on onboarding completion
- **No dedicated UI** prominently surfaces this program anymore (PersonalizedProgramCard removed)
- Data may still live in user context but is easy for users to miss

---

## 3. AI-Generated Program

### What it is

A **“Generate Your AI Program”** feature that builds a **2-routine program** from **real exercises in the Supabase CMS**, filtered by the user’s DUPR rating and focus skills.

Despite the “AI” label, it is **rules-based selection** (query + filter + distribute) — not an LLM. The “AI” branding reflects automated personalization.

### User value

- **Database-backed content:** Uses the same exercises coaches/admins publish — instructions, videos, tips, DUPR ranges
- **Truly personalized:** Matches *your* DUPR and *your* chosen focus areas from onboarding/profile
- **Ready to train:** Opens like any other program → routines → exercises → log results
- **Syncs to account:** Saved to Supabase (with offline fallback) — available across devices
- **Regeneratable:** “Update Your AI Program” replaces the old one (with confirmation)

### User flow (when UI was visible)

```
1. Open Program tab → Programs sub-tab
2. Empty state OR existing programs list
3. Tap "Generate Your AI Program" 🤖
   (or "Update Your AI Program" 🔄 if one already exists)
4. Full-screen overlay with 4 animated steps (~few seconds):
   • 🧠 Analyzing Your Profile — "Reviewing your DUPR rating and focus areas..."
   • 🎯 Finding Perfect Exercises — "Matching exercises to your skill level..."
   • 🏗️ Building Your Routines — "Creating personalized training sessions..."
   • ✨ Finalizing Your Program — "Adding the finishing touches..."
5. Success alert with program name, routine count, DUPR level
6. Program appears in list with 🤖 AI badge (📱 Local if sync failed)
7. Tap program → RoutineDetail → ExerciseDetail → log results
```

### Requirements to generate

| Requirement | Detail |
|-------------|--------|
| DUPR rating | 2.0 – 8.0 (from profile/onboarding) |
| Focus areas | At least 1 valid skill (max 6 used for matching) |
| Onboarding | Must have completed skill preferences |
| Database | Published exercises must exist matching DUPR + skills |

### How matching works (product logic)

1. **DUPR filter:** Exercise’s `dupr_range_min`–`dupr_range_max` must include user’s rating (or exercise has no range = general)
2. **Focus filter:** Exercise skill tags must overlap with user’s focus areas (flexible string matching)
3. **Difficulty cap by DUPR:**

   | DUPR | Tier | Max exercise difficulty |
   |------|------|-------------------------|
   | &lt; 2.5 | Beginner | 2 |
   | 2.5 – 3.5 | Intermediate | 3 |
   | 3.5 – 4.5 | Advanced | 4 |
   | ≥ 4.5 | Elite | 5 |

4. **No duplicates:** Same exercise never appears twice across both routines

### Generated program structure

| Property | Value |
|----------|-------|
| Name | `"{Name}'s AI-Generated Program"` |
| Routines | **2** |
| Exercises | **4 + 3** (7 total) |
| Routine 1 | **Foundation & Fundamentals** (~45 min) — easier drills, primary focus areas |
| Routine 2 | **Advanced Skills & Strategy** (~50 min) — harder drills, reversed focus priority |
| Category | “AI Generated” |
| Flags | `is_ai_generated: true`, stores `user_dupr_rating` + `user_focus_areas` |

### Persistence & sync

- **Primary:** Saved to Supabase via `create_program_as_user` → routines → links to existing or new exercises
- **Fallback:** Local-only with `is_synced_to_db: false` if network/DB fails
- **Auto-sync:** On app load, unsynced AI programs retry upload
- **Local backup:** Also stored in AsyncStorage per user

### Update / delete behavior

- **One AI program per user** (UI prevented generating a second; offered “Update” instead)
- **Update:** Deletes old program (DB + local) → generates fresh one
- **Delete:** Long-press program card → removes from DB and local list

### Error cases (user-facing)

| Situation | Message intent |
|-----------|----------------|
| No DUPR / focus areas | “Complete onboarding / update profile” |
| No exercises match DUPR + skills | “No matching exercises — contact support or adjust focus areas” |
| DUPR matches but skills don’t | “Found X exercises for your level, but none match your focus areas” |
| Network failure | Saved locally, sync later |

### Status today

- **Backend logic fully implemented** (`aiProgramGenerator.js`)
- **UI buttons commented out** in ProgramScreen (“temporarily hidden”)
- **Generation overlay + update/delete handlers still in code** — can be re-enabled quickly
- **Programs sub-tab removed** from tab bar — even if re-enabled, needs a home in the UI

---

## How the three systems compare

| Dimension | DUPR 2→3 | Onboarding Personal | AI Program |
|-----------|----------|---------------------|------------|
| **Personalization input** | Fixed ladder (you pick step) | Focus areas + DUPR | Focus areas + DUPR |
| **Content source** | Hardcoded matrix | Hardcoded bank | Supabase CMS |
| **Structure** | 11 levels × 1 session | 4 sessions | 2 routines |
| **Gamification** | Badges, locks, progress path | Minimal | AI badge on card |
| **Persistence** | Local only | UserContext | DB + local |
| **DUPR range** | 2.0 – 3.0 only | Any (difficulty scaled) | 2.0 – 8.0 |
| **Best for** | Climbing 2.x → 3.0 | First-day wow moment | Ongoing personalized training |

---

## Supporting product context

### DUPR in onboarding (still active)

- **Training Goal screen:** Option “Improve my DUPR rating”
- **Rating Selection screen** (separate flow): Enter official DUPR (2.0–8.0), self-rate, or default 2.0
- **Profile:** DUPR display, manual edit, “Sync DUPR” placeholder (not live API)

### DUPR on exercises in CMS (still active)

Admin/coach exercise editor supports **DUPR Range (min–max)** per exercise. This powers AI program matching and is displayed in program structure modals — independent of the removed 2→3 tab.

### Exercise logging (shared)

All program types ultimately funnel into the same **Exercise Detail → Log Result** flow:

- Pass/fail vs target
- Difficulty rating after completion
- History of attempts

AI programs preload full exercise data for instant navigation; DUPR 2→3 drills used simpler inline instructions.

---

## Current status in the app today

| Feature | Visible? | Notes |
|---------|----------|-------|
| DUPR 2→3 tab | ❌ No | SkillsScreen deleted Oct 2025 |
| Badge collection UI | ❌ No | BadgesScreen deleted |
| `2.0to3.0_badges_matrix.md` | ✅ In repo | Reference data only |
| Onboarding program generation | ⚠️ Runs silently | ProgramLoadingScreen still executes |
| PersonalizedProgramCard | ❌ No | Removed Sept 2025 |
| AI Generate button | ❌ No | Commented out in ProgramScreen |
| AI generator logic | ✅ In codebase | Ready to re-enable |
| Program tab sub-tabs | Coach Program + Library only | “Programs” view unreachable from tabs |
| DUPR on profile | ✅ Yes | Edit + sync placeholder |
| DUPR range on CMS exercises | ✅ Yes | Admin/coach tooling |

---

## Revival considerations (product notes)

If bringing features back:

1. **DUPR 2→3** — Strong gamification, but overlaps with AI program and Library. Consider: merge badge logic into profile, or offer as “Beginner Path” for DUPR &lt; 3.0 only.

2. **AI Program** — Lowest lift to restore (uncomment UI + pick a tab home). Depends on CMS having enough published exercises with DUPR ranges + skill tags.

3. **Onboarding program** — Either surface it again (card on Program tab) or replace entirely with AI generation at end of onboarding.

4. **Tab clutter** — Original reason for hiding: too many sub-tabs (Programs, DUPR 2→3, Library, Coach, Fun). Any revival should pick **one primary “My Training” entry point** or use nested navigation.

---

## File & asset references (for revival)

| Asset | Location | Role |
|-------|----------|------|
| Skills Screen (deleted) | git: `750525d7^:src/screens/SkillsScreen.js` | Full DUPR 2→3 UX |
| Badge matrix | `2.0to3.0_badges_matrix.md` | Badge definitions |
| AI generator | `src/lib/aiProgramGenerator.js` | DB-backed program builder |
| Onboarding generator | `src/lib/programGenerator.js` | 4-session static builder |
| Loading UX | `src/screens/ProgramLoadingScreen.js` | Onboarding generation animation |
| AI readme | `AI_PROGRAM_GENERATOR_README.md` | Implementation notes |
| Program screen | `src/screens/ProgramScreen.js` | Tab shell, hidden AI buttons |

---

## Glossary

| Term | Meaning in this app |
|------|---------------------|
| **DUPR** | Dynamic Universal Pickleball Rating — skill level scale ~2.0–8.0 |
| **Program** | Container: name + routines/sessions + exercises |
| **Routine / Session** | One training unit (~45–60 min) with ordered exercises |
| **Drill / Exercise** | Single practice item with a measurable goal |
| **Focus areas** | Skills user wants to improve (from onboarding) |
| **P-2.x** | Program ID in the 2→3 matrix (e.g. P-2.5 = DUPR 2.5 level) |
