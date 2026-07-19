# Onboarding v2 — Player & Coach Flows

**Status: Implemented.** This document is the canonical spec for the v2 onboarding introduced in July 2026. Resolved open items are annotated inline.

---

## Overview

AcademyPro v2 onboarding adds a **role-aware funnel**: the first screen asks whether the user is a Player or a Coach. Each role has its own path before converging at the Main/Profile landing.

```
RoleSelection (C1)
  │
  ├─ Player → SportSelection → IntroScreen → Gender → Rating → Name → OnboardingNavigator → CreateAccount/SignUp → OnboardingFinish → Main
  │
  └─ Coach  → SportSelection → CoachBenefitsScreen (3 slides + Sign In) → SignUpScreen → CreateCoachProfileScreen → Profile
```

---

## Screen inventory

| Code | Screen | File | Status |
|------|--------|------|--------|
| C1 | Role Selection | `src/screens/RoleSelectionScreen.js` | New |
| C2 | Sport Selection | `src/screens/SportSelectionScreen.js` | Reused (+ back button) |
| C3 | Coach Benefits | `src/screens/CoachBenefitsScreen.js` | New |
| C4 | Player Intro | `src/screens/IntroScreen.js` | Reused |
| C5 | Coach Sign-Up | `src/screens/SignUpScreen.js` | Reused (mode='coach') |
| C5p | Player Sign-Up | `src/screens/SignUpScreen.js` | Reused |
| C6 | Coach Profile | `src/screens/CreateCoachProfileScreen.js` | Reused + sport-aware rating + onSaved callback |
| C7 | Profile landing | `src/screens/ProfileScreen.js` | "Create Academy" CTA (renamed from "Start Your Academy") |
| C8 | Create Academy | `src/components/StartAcademyModal.js` | Reused |
| C9 | Dashboard | `src/components/AdminRoute.js` | Reused (Admin > Academy > Coach priority) |

---

## Gate logic (`App.js`)

### Pre-auth (not signed in)

```
!hasSelectedRole             → RoleSelectionScreen
!hasSelectedSport            → SportSelectionScreen (both roles)
role=coach && !hasCompletedCoachBenefits → CoachOnboardingNavigator (Benefits → SignUp)
role=player && !hasCompletedIntro        → IntroScreen
!hasSelectedGender           → GenderSelectionScreen        [player only]
!hasSetRating                → RatingSelectionScreen         [player only]
!hasSetName                  → PersonalProgramScreen         [player only]
!hasCompletedOnboarding      → OnboardingNavigator           [player only]
```

### Post-auth (signed in)

```
authenticated + hasCompletedOnboarding + role=coach + !hasCompletedCoachProfile
  → CreateCoachProfileScreen (fromOnboarding=true)

authenticated + hasCompletedOnboarding + hasCompletedCoachProfile
  → Main (initialTab = 'Profile' if routeToProfile flag set by handleAuthenticate)

authenticated + !hasCompletedOnboarding
  → OnboardingFinishScreen (player new-user flow)
```

---

## C1 — Role Selection

**File:** `src/screens/RoleSelectionScreen.js`

- Title: **How will you use AcademyPro?**
- Two cards: **Player** / **Coach** (same visual pattern as SportSelectionScreen)
- No back button (first screen in the funnel)
- On select: `completeRoleSelection('player' | 'coach')`

---

## C2 — Sport Selection

**File:** `src/screens/SportSelectionScreen.js`

- Unchanged visually
- Now receives `onGoBack` prop → shows back chevron to return to Role Selection
- Available sports: Pickleball, Padel

---

## C3 — Coach Benefits (3 slides)

**File:** `src/screens/CoachBenefitsScreen.js`

Slide copy:

| # | Title | Subtitle |
|---|-------|---------|
| 1 | Anyone can coach. Winners build systems | Turn your coaching into a real academy… |
| 2 | One curriculum. Every coach. Every student | Add coaches without losing what made you good… |
| 3 | Your academy. Your name. Your price | White-label from day one… |

- Back button (top-left) navigates to Sport Selection
- Last slide: **Get Started** CTA + **Sign In** link (→ `AuthScreen`)
- Other slides: **Next** CTA only

---

## C5 — Coach Sign-Up

**File:** `src/screens/SignUpScreen.js` (reused, no visual changes)

Called from `CoachOnboardingNavigator` with `route.params.mode = 'coach'`.

Payload differences when `mode='coach'`:
- Merges `{ role: 'coach', sport_id: user.sportId }` instead of full player onboarding data
- No gender, rating, goal, time, intensity fields

---

## C6 — Coach Profile

**File:** `src/screens/CreateCoachProfileScreen.js`

**Sport-aware rating field:**
- Uses `getSport(user.sportId).ratingSystem` for label, placeholder, min/max validation
- Pickleball → **DUPR** (2.0–8.0)
- Padel → **Playtomic** (0.0–7.0)  ← updated in v2

**On save from onboarding (`fromOnboarding=true`):**
- Calls `onSaved()` callback → `completeCoachProfile()` in App.js
- App sets `routeToProfile=true` → Main opens on **Profile** tab

**`is_active` policy (resolved open item):**
- `is_active: true` on save → immediate Coach Dashboard access
- `is_verified: false` → pending manual review, gates directory publish only
- `is_accepting_students: false` → user opts in to directory listing separately

---

## C7 — Profile landing

**File:** `src/screens/ProfileScreen.js`

After coach onboarding saves, Profile shows:
- **Create Academy** CTA (renamed from "Start Your Academy")
- **Coach Dashboard** row (visible because `is_active=true`)
- **Become a Coach** row hidden once coach row exists

---

## C9a — Returning coach sign-in

**File:** `App.js` → `handleAuthenticate()`

When a user signs in via `AuthScreen`:

1. All pre-auth onboarding flags are marked complete (avoids flash back to onboarding screens).
2. Sport/role are **not** overwritten if already persisted in AsyncStorage.
3. `checkCoachAccess(userId)` is called:
   - **Coaches row exists (`is_active=true`):** `completeCoachProfile()` is called, `routeToProfile=true` → lands on Profile tab.
   - **No coaches row:** standard player behavior → lands on the default Explore tab.

---

## Padel — Playtomic rating (resolved open item)

**File:** `src/lib/sportConfig.js`

```js
// Before (v1)
type: 'padel_level', label: 'Level', min: 1.0, max: 10.0

// After (v2)
type: 'playtomic', label: 'Playtomic', min: 0.0, max: 7.0
```

Tiers:
| Tier | Range |
|------|-------|
| Beginner | 0.0 – 2.0 |
| Intermediate | 2.0 – 4.0 |
| Advanced | 4.0 – 6.0 |
| Pro | 6.0 – 7.0 |

Rating options copy updated to "Enter your official Playtomic rating" / "I don't have a rating" / "I'm new to padel".

---

## State management (`UserContext.js`)

New flags in `@academypro_onboarding_state`:

| Flag | Type | Description |
|------|------|-------------|
| `hasSelectedRole` | bool | Role selection complete |
| `hasCompletedCoachBenefits` | bool | Coach benefits carousel complete |
| `hasCompletedCoachProfile` | bool | Coach profile created during onboarding |

New field in `DEFAULT_USER`:
- `role: null` — persisted as `'player' | 'coach'`

**Migration for existing users:** if any of the v1 flags (sport, intro, gender, rating) are already set and `hasSelectedRole` is absent, the user is treated as `role='player'` with `hasSelectedRole=true`. No re-onboarding is shown.

New handlers: `completeRoleSelection`, `resetRoleSelection`, `completeCoachBenefits`, `resetCoachBenefits`, `completeCoachProfile`.

---

## Files created (new)

| File | Purpose |
|------|---------|
| `src/screens/RoleSelectionScreen.js` | Player / Coach fork |
| `src/screens/CoachBenefitsScreen.js` | 3-slide coach carousel |
| `src/navigation/CoachOnboardingNavigator.js` | Benefits → SignUpScreen stack |

## Files modified

| File | Change |
|------|--------|
| `App.js` | Role-aware gate; C9a `handleAuthenticate`; new imports |
| `src/context/UserContext.js` | `role`, `hasSelectedRole`, coach flags + handlers; migration |
| `src/lib/sportConfig.js` | Padel → Playtomic 0.0–7.0 |
| `src/lib/onboardingSteps.js` | Added `ROLE: -1` pre-step |
| `src/screens/SignUpScreen.js` | Coach mode payload |
| `src/screens/CreateCoachProfileScreen.js` | Sport-aware rating; `fromOnboarding` + `onSaved` props |
| `src/screens/ProfileScreen.js` | Renamed "Start Your Academy" → "Create Academy" |
| `src/screens/SportSelectionScreen.js` | Added `onGoBack` back-button prop |

## Files reused without change

- `src/screens/AuthScreen.js`
- `src/navigation/OnboardingNavigator.js`
- `src/components/AdminRoute.js`
- `src/components/StartAcademyModal.js`

---

## Deferred (not in v2 scope)

- Multi-sport coach (single sport per coach profile for now)
- Paywall / subscription gate on coach features
- Exact academy popup fields beyond name, slug, logo
- Merged single sign-up screen for both roles
- Fix `TimeCommitmentScreen` hardcoded pickleball skills (known v1 gap)
