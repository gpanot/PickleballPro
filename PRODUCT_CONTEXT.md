# PicklePro — Product Context Document

> **Purpose:** This document gives a new AI agent (or developer) a complete understanding of the PicklePro project — what it is, who it is for, how it is structured, and what every major feature does.

---

## 1. What is PicklePro?

**PicklePro** (app name: *PicklePro*, package: `com.picklepro.mobile`, repo name: *Pickleball_Hero*) is a **pickleball training app** targeting players who want to improve their game using a structured, DUPR-rating-based curriculum.

The product has two surfaces:

| Surface | Target user | How to access |
|---|---|---|
| **Mobile app** (React Native / Expo) | Players and coaches on the go | iOS / Android via Expo or stores |
| **Web admin dashboard** | Admins managing content | Browser via `npm run web` or Vercel deployment |

Both surfaces share the same **Supabase** backend (Postgres + Auth + Storage).

**App version:** 1.1.0 (Android versionCode 12)  
**Deep-link scheme:** `pickleballhero://`  
**Associated domain:** `pickleballhero.app`

---

## 2. Target Users

| Role | Description |
|---|---|
| **Player** | Pickleball player with a DUPR rating between 2.0–8.0. Uses the app to follow structured drills, track progress, and find coaches. |
| **Coach** | A player who has created a coach profile. Gets an extra "Academy" tab to manage students, run assessments, and assign programs. |
| **Admin** | Has admin access in Supabase. Accesses the full Admin Dashboard to manage programs, exercises, coaches, and users. |

---

## 3. Tech Stack

| Layer | Technology |
|---|---|
| Mobile app | React Native 0.81.5, Expo 54 |
| Web admin | React Native Web 0.21 (same codebase, `Platform.OS === 'web'` guards) |
| Navigation | React Navigation 6 (Stack + Bottom Tabs) |
| State | React Context (AuthContext, UserContext, LogbookContext, ProgramContext, PreloadContext) |
| Backend | Supabase (Postgres, Auth, Storage, Edge Functions) |
| Auth | Supabase Auth — email/password only (PKCE flow) |
| Media | Supabase Storage or external video URLs |
| Maps | Google Maps (iOS + Android, `expo-location`) |
| Build | EAS Build (Expo Application Services) |
| Web deploy | Vercel / Netlify |

**Key dependencies:**
- `@supabase/supabase-js` ^2.57
- `expo-camera` (QR code scanner, assessments)
- `expo-image-picker` + `expo-image-manipulator` (avatar upload + crop)
- `expo-av` (video playback in exercise detail)
- `react-native-maps` (coach location / leaderboard nearby filter)
- `react-native-qrcode-svg` (doubles game join code)
- `expo-haptics` (feedback on interactions)

---

## 4. Onboarding Flow (non-authenticated users)

New users go through a step-by-step flow before reaching the main app:

```
SplashScreen
  └── IntroScreen          ← "Welcome to PicklePro" landing
      └── GenderSelectionScreen   ← gender (used for leaderboard filtering)
          └── RatingSelectionScreen    ← DUPR rating (2.0–8.0) + rating type (self/official)
              └── PersonalProgramScreen   ← set display name
                  └── OnboardingNavigator
                        ├── TrainingGoalScreen     ← what the player wants to achieve
                        ├── TimeCommitmentScreen   ← hours/week available
                        ├── IntensitySelectionScreen ← workout intensity preference
                        ├── FocusAreasScreen        ← skill tags to focus on
                        ├── CoachingPreferenceScreen ← wants a coach or self-guided
                        └── CommitmentVisualizationScreen ← summary + CTA
```

Authenticated users skip the entire onboarding and land directly on the main app. All onboarding state is persisted in `AsyncStorage` via `UserContext`.

---

## 5. Main App — Bottom Tab Navigation

After onboarding (or login), users see a **bottom tab bar** with:

| Tab | Screen | Available to |
|---|---|---|
| **Program** | `ProgramScreen` | Everyone |
| **Academy** | `CoachNavigator` | Coaches only (and only if `is_accepting_students = true`) |
| **Leaderboard** | `LeaderboardScreen` | Everyone |
| **Logbook** | `LogbookScreen` | Everyone |

---

## 6. Feature Details

### 6.1 Program Screen (`ProgramScreen`)

The core player experience. Has two sub-tabs:

**"My Program" tab**
- Displays the user's **AI-generated personalized program** based on their DUPR rating and selected focus areas.
- The AI generator (`src/lib/aiProgramGenerator.js`) queries real exercises from the database filtered by:
  - DUPR difficulty tier (Beginner < 2.5, Intermediate 2.5–3.5, Advanced 3.5–4.5, Elite 4.5+)
  - Selected focus skill tags (up to 6 skills)
- Program is structured as: **Program → Routines → Exercises**
- Users can view routine details (`RoutineDetailScreen`) and individual exercise details (`ExerciseDetailScreen`)
- User can regenerate their AI program
- Supports sharing programs

**"Library" tab**
- Browses all published programs from the admin CMS
- Grid layout with responsive columns (2–4 depending on device width, iPad-optimized)
- Tap → `ProgramDetailScreen`

**Profile section**
- Avatar (upload + crop via `expo-image-picker` + `expo-image-manipulator`)
- Shows user name, DUPR rating, tier, badges
- Access to Profile, Admin (if admin), Coach profile creation, App Settings, Help & Support, Logout

### 6.2 Exercise Detail Screen (`ExerciseDetailScreen`)

- Shows exercise title, goal, instructions, media (image/video, YouTube support)
- **Log Result**: user inputs result (count, streak, etc.)
- Pass/fail evaluation against target value
- Exercise history modal showing past attempts

### 6.3 Logbook Screen (`LogbookScreen`)

- Training session journal
- Each entry records: date, duration, feeling (emoji 1–5 scale), training focus (skill tags), notes
- Summary stats (total sessions, avg feeling, most practiced skills)
- Add/edit/delete entries
- Backed by `logbook_entries` table in Supabase

### 6.4 Leaderboard Screen (`LeaderboardScreen`)

- Global ranking by XP/score
- Filters: Global, Nearby (uses device GPS), Male, Female, Other
- Shows current user's rank and score
- Location data stored in `users` table

### 6.5 Coach Academy (Coach-only tab)

Accessed via the **Academy** bottom tab, only visible to coaches with `is_accepting_students = true`.

Screen stack (`CoachNavigator`):

| Screen | Purpose |
|---|---|
| `CoachDashboardScreen` | Lists students + coach's programs. Two tabs: Students / Programs. Add student by code. |
| `PlayerProfileScreen` | Full student profile: name, rating, badges, progress stats |
| `AssignProgramListScreen` | Assign a training program to a student |
| `AssessmentOverviewScreen` | Overview of a student's skill assessments |
| `SkillDetailScreen` | Detail for a single skill assessment |
| `EvaluationSummaryScreen` | Post-evaluation summary |
| `FirstTimeAssessmentScreen` | Run a first-time skill assessment for a new student |
| `FirstTimeAssessmentSummaryScreen` | Summary of first-time assessment results |
| `StudentLogbookScreen` | View a student's training logbook |

**Student linking mechanism:** Each player has a unique **student code** (6 chars). Coach enters this code to add the student. Relationship stored in `coach_students` table.

### 6.6 Fun Game — 6-Point Tracker

A lightweight in-game score tracking mode for doubles pickleball.

Screens:
- `GamePlayedListScreen` — history of past games
- `DoublesSetupScreen` — set up two teams (A1/A2 vs B1/B2), QR-based join code for other players to join
- `UITestGameScreen` — live game score tracking with point-by-point logging, shot error tagging (Bad Serve, Bad Drop, Net, Out, etc.)
- `SixPointSummaryScreen` — post-game summary with per-player stats and error breakdown. Can save to Supabase.

### 6.7 Admin Dashboard (`AdminDashboard`)

Web-first admin interface (works on mobile too, but optimized for desktop). Protected by `AdminRoute` which checks `admin_users` table.

**Tabs:**
- **Dashboard** — stats overview (programs, exercises, coaches, users counts)
- **Content Management** — sub-tabs:
  - *Programs* — `ProgramsTable`: list, create, edit, delete programs
  - *Routines* — `RoutinesTable`: manage routines within programs
  - *Exercises* — `ExercisesTable`: full exercise editor (code, title, goal, instructions, target type/value, difficulty, tags, media URLs, status)
  - *Categories* — `CategoriesTable`: skill categories
- **Coaches** — list of coaches, view details, manage
- **Users** — list of all users, view logbook (`WebUserLogbookModal`), soft delete

**Modals:**
- `WebCreateProgramModal` — create new program
- `WebCreateRoutineModal` — create new routine (linked to program)
- `WebCreateExerciseModal` — create new exercise (linked to routine)
- `EditableProgramStructureModal` — drag-and-rearrange program structure
- `ProgramStructureModal` — read-only program structure view
- `AddCoachModal` — add a new coach profile
- `AddUserModal` — add a new user
- `WebUserLogbookModal` — view any user's logbook entries

---

## 7. Data Model (Supabase Tables)

| Table | Key columns | Purpose |
|---|---|---|
| `users` | `id`, `email`, `name`, `dupr_rating`, `tier`, `rating_type`, `gender`, `goal`, `time_commitment`, `intensity`, `focus_areas`, `coach_preference`, `avatar_url`, `student_code`, `location` | Player profiles |
| `admin_users` | `user_id`, `role` | Admin access control |
| `programs` | `id`, `title`, `description`, `thumbnail_url`, `is_published`, `created_by` | Training programs (groups of routines) |
| `routines` | `id`, `program_id`, `title`, `description`, `order` | Routines within a program |
| `exercises` | `id`, `routine_id`, `code`, `title`, `goal_text`, `instructions_md`, `target_type`, `target_value`, `difficulty`, `media` (JSON), `tags`, `status`, `version` | Individual drills |
| `user_progress` | `id`, `user_id`, `exercise_id`, `result_value`, `passed`, `created_at` | Player exercise completion records |
| `logbook_entries` | `id`, `user_id`, `date`, `duration_minutes`, `feeling`, `training_focus`, `notes`, `created_at` | Training journal entries |
| `coaches` | `id`, `user_id`, `name`, `bio`, `hourly_rate`, `rating_avg`, `specialties`, `dupr_rating`, `verified`, `location`, `is_accepting_students`, `avatar_url` | Coach profiles |
| `coach_students` | `id`, `coach_id`, `student_id`, `created_at` | Coach ↔ student relationships |
| `skill_assessments` | coach-assessed skill ratings per student | Student skill evaluation data |
| `games` | game session data for 6-point tracker | Doubles game records |

---

## 8. Skill Tags System

Skills are defined in `src/data/Commun_skills_tags.json` and organized into categories:

| Category | Example skills |
|---|---|
| **Technical** | Dinks, Drives, Serves, Returns, Volleys, Drops (3rd shot), Lobs, Resets, Smashes |
| **Movement** | Footwork, Transition zone movement, Lateral movement, Recovery |
| **Strategy** | Court positioning, Doubles communication, Shot selection, Stacking |
| **Mental** | Focus, Consistency under pressure, Match play mindset |

Each skill has: `id`, `name`, `emoji`, `color`, `difficulty`, `description`, `tags`, and `aiRecommendations` (related skills, progression path, practice frequency, importance score).

These tags are used in:
- Onboarding (`FocusAreasScreen`) — player selects 1–6 focus skills
- AI Program Generator — filters exercises matching selected skills
- Logbook entries — training focus tagging
- Exercise table — searchable/filterable skill tags

---

## 9. AI Program Generator

Located at `src/lib/aiProgramGenerator.js`.

**Logic:**
1. Takes user's `duprRating` and `focus_areas` (skill tag IDs)
2. Determines difficulty tier and max difficulty level
3. Queries Supabase `exercises` table filtered by skill tags and difficulty
4. Groups exercises into routines by skill area (up to 6 routines, 3–5 exercises each)
5. Constructs a complete program object with metadata
6. Saves to `programs` table (or unsynced queue in AsyncStorage if offline)
7. On reconnect, `syncUnsyncedAIPrograms()` pushes offline-created programs

**Validation:** User must have both `duprRating` and at least one `focus_area` to generate.

---

## 10. Authentication Flow

- **Supabase Auth** with email/password (PKCE flow)
- Session persisted to `AsyncStorage` via custom storage adapter
- `AuthContext` (`src/context/AuthContext.js`) is the source of truth
- `UserContext` syncs from `AuthContext` on login
- Admin access: checked against `admin_users` table (`checkAdminAccess()`)
- Coach access: checked against `coaches` table (`checkCoachAccess()`)
- On logout: resets to intro screen, clears user state

**Screens:**
- `AuthScreen` — login form
- `SignUpScreen` — registration
- `CreateAccountScreen` — extended registration with onboarding data

---

## 11. Navigation Map

```
App
├── SplashScreen
├── [Onboarding flow] (non-auth, incomplete onboarding)
│   ├── IntroScreen → Auth
│   ├── GenderSelectionScreen → Auth
│   ├── RatingSelectionScreen → Auth
│   ├── PersonalProgramScreen → Auth
│   └── OnboardingNavigator → Auth
└── [Main app] (auth OR completed onboarding)
    ├── Main (MainTabNavigator)
    │   ├── Tab: Program (ProgramScreen)
    │   ├── Tab: Academy (CoachNavigator) — coach only
    │   │   ├── CoachDashboard
    │   │   ├── PlayerProfile
    │   │   ├── AssignProgramList
    │   │   ├── AssessmentOverview
    │   │   ├── SkillDetail
    │   │   ├── EvaluationSummary
    │   │   ├── FirstTimeAssessment
    │   │   ├── FirstTimeAssessmentSummary
    │   │   └── StudentLogbook
    │   ├── Tab: Leaderboard (LeaderboardScreen)
    │   └── Tab: Logbook (LogbookScreen)
    ├── CoachDetail (CoachScreen — coach finder)
    ├── ExerciseDetail
    ├── ExercisePicker
    ├── AddExercise
    ├── AddTrainingSession
    ├── EditTrainingSession
    ├── LogConfirmation
    ├── ProgramDetail
    ├── RoutineDetail
    ├── Profile (ProfileScreen)
    ├── Admin (AdminRoute → AdminDashboard)
    ├── CreateCoachProfile
    ├── CropAvatar
    ├── AppSettings
    ├── HelpSupport
    ├── GamePlayedList
    ├── DoublesSetup
    ├── SixPointSummary
    └── UITestGame
```

---

## 12. Key File Locations

| What | Where |
|---|---|
| App entry point | `App.js` |
| Supabase client + all API functions | `src/lib/supabase.js` |
| AI program generator | `src/lib/aiProgramGenerator.js` |
| Auth state | `src/context/AuthContext.js` |
| User/onboarding state | `src/context/UserContext.js` |
| Logbook state | `src/context/LogbookContext.js` |
| Preloading (data cache) | `src/context/PreloadContext.js` |
| Skill tags data | `src/data/Commun_skills_tags.json` |
| Main tab navigator | `src/navigation/MainTabNavigator.js` |
| Coach screens | `src/screens/coach/` |
| Fun game screens | `src/screens/fungame/` |
| Admin dashboard | `src/screens/AdminDashboard.js` |
| Admin sub-components | `src/screens/admindashboard/` |
| Shared components | `src/components/` |
| Supabase Edge Functions | `supabase/functions/` |

---

## 13. Deployment

| Target | Command | Notes |
|---|---|---|
| iOS (dev) | `expo run:ios` | Requires macOS + Xcode |
| Android (dev) | `expo run:android` | Requires Android SDK |
| Expo Go (dev) | `npm start` | Scan QR code |
| Web (dev) | `npm run web` | Expo with Metro bundler |
| Web (prod build) | `npm run build:web` | Outputs to `dist/` |
| Vercel deploy | `npm run deploy:vercel` | Auto-builds then deploys |
| Netlify deploy | `npm run deploy:netlify` | Auto-builds then deploys |
| EAS Build | `eas build` | Cloud build for stores |

**Supabase project URL:** `https://qdlvidtnfqnqjgrhxwtz.supabase.co`

---

## 14. Curriculum Structure (DUPR 2.0 → 5.0)

The default curriculum (seeded in PRD) covers:

| Tier | DUPR Range | Levels | Focus areas |
|---|---|---|---|
| Beginner | 2.0–3.0 | 1–5 | Dinks, Drives, Serves, Returns, NVZ Transition |
| Intermediate | 3.0–4.0 | 6–10 | Serve upgrades, 3rd shot drop, Dink pressure, Volleys, Strategy |
| Advanced | 4.0–5.0 | 11–15 | Advanced serve/return, Reset mastery, Attacking, Doubles tactics, Mental game |

Each level has **3 core drills** (must complete to unlock next level) + **1 optional Extra** (leaderboard challenge).

---

## 15. Permissions Required (Mobile)

| Permission | Used for |
|---|---|
| Camera | Avatar photo, QR scanner (doubles game join), exercise media |
| Location (fine + coarse) | Nearby leaderboard, coach map |
| Storage read | Image picker |
| Internet | All API calls |
| Vibrate | Haptic feedback |
