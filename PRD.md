# 🎾 PicklePro MVP — Product Requirements Document (PRD, DUPR-based)

---

## 1. 🎯 Objective
Deliver a **mobile app (React Native)** for players and a **web admin (React)** for admins/coaches.  
- Player side: syncs with **official DUPR rating (2.0–8.0)** and guides players through **structured drills** to improve.  
- Admin side: manage drills, levels, tiers, and coach profiles.  
- Coaches: discoverable by players, tied to DUPR credibility.  

---

## 2. 🧑‍🤝‍🧑 Target Users

### Players
- DUPR 2.0 → 8.0 (Beginner → Pro).  
- Use DUPR for official rating & matches.  
- Use PicklePro for **training progression & coach discovery**.  

### Coaches
- Create profile with bio, specialties, hourly rate.  
- Optionally show their own DUPR rating.  
- Gain students via app marketplace.  

### Admins
- Create/edit/publish structured curriculum.  
- Manage coach profiles.  
- Control version releases of drills.  

---

## 3. 📱 Player App (React Native) — MVP Features

### Authentication
- Email login via Supabase Auth.  
- Link DUPR account (API/OAuth).  

### Player Profile
- Shows **official DUPR rating (2.0–8.0)** (synced from DUPR).  
- Shows **tier**:  
  - Beginner → 2.0–3.0  
  - Intermediate → 3.0–4.0  
  - Advanced → 4.0–5.0  
  - Pro → 5.0–8.0  
- Badges shelf (completed in-app milestones).  
  

### Skill Tree View
- Show the progression of the Tier/Level at the top
- Displays drills grouped into **levels within DUPR tier**.  
- Beginner Tier (Levels 1–5), Intermediate Tier (Levels 6–10), Advanced Tier (Levels 11–15).  
- Locked levels are grayed out until prerequisites complete.  
- Extras show as side challenges (optional XP/leaderboards).  

### Exercise Detail
- Title, goal, instructions, demo media.  
- Input field to log result (manual count/streak).  
- Submit → mark pass/fail based on target.  
- Success overlay 🎉 with option to share.  

### Badge System
- Completing all exercises in Level → unlocks **Level Badge**.  
- Completing all Levels in Tier → unlocks **Tier Badge** (e.g., “3.0 Ready”).  
- **Note:** badges are motivational; official DUPR is unchanged.  

### Coach Finder
- Directory of coaches (from Admin CMS).  
- Filters: price/hour, rating, specialty, location.  
- Coach profile: name, bio, DUPR (optional), price, reviews.  
- CTA: `[Contact/Book]` (external link or WhatsApp in MVP).  

---

## 4. 🖥 Web Admin (React) — MVP Features

### Dashboard
- Overview stats: #tiers, #levels, #exercises, #coaches.  
- Activity log of new/edited content.  

### Curriculum Manager
- Tree view: Tiers → Levels → Exercises.  
- Example: Beginner (2.0–3.0) → Level 1 (Dinks) → 1.1, 1.2, 1.3.  

### Exercise Editor
- Fields:  
  - Code (e.g., `1.2`)  
  - Title  
  - Goal text  
  - Instructions (Markdown)  
  - Target type (`streak|count|percent|passfail|leaderboard`)  
  - Target value (e.g., `8 in a row`)  
  - Difficulty (1–5)  
  - Validation mode (`manual|coach|ai`)  
  - Media (image/video URLs)  
- Buttons: `[Save Draft]` `[Publish]`.  

### Coach Manager
- Table view of coaches.  
- Add/Edit/Delete profile (name, bio, DUPR rating, price, specialties, verified flag).  

### Release Manager
- Publish curriculum versions (v1, v1.1, etc.).  
- Sync instantly to Player App.  

---

## 5. 🗄️ Data Model (Supabase/Postgres)

**players**  
- id, name, email, dup_r_id, dup_r_rating, dup_r_synced_at  

**tiers**  
- id, name (Beginner, Intermediate…), dup_r_min, dup_r_max  

**levels**  
- id, tier_id, name, order, summary, is_published  

**exercises**  
- id, level_id, code, title, goal_text, instructions_md  
- target_type, target_value, validation_mode  
- difficulty, media(json), status, version  

**coaches**  
- id, name, bio, hourly_rate, rating_avg, rating_count  
- specialties, dup_r_rating, verified, location  

**player_progress**  
- id, player_id, exercise_id, result_value, passed, created_at  

---

## 6. ⚙️ Tech Stack

- **Player App:** React Native (Expo), React Navigation, Zustand, React Query, Expo Video Player.  
- **Web Admin:** React + Next.js, TailwindCSS, TanStack Table, React Hook Form.  
- **Backend:** Supabase (Postgres + Auth + Storage).  
- **Auth:** Supabase Auth (email + DUPR OAuth).  
- **Media:** Supabase Storage or Cloudinary.  
- **Integration:** DUPR API (ratings sync, profile).  

---

## 7. 🚀 MVP Scope

- Beginner Tier (2.0–3.0) + Intermediate Tier (3.0–4.0) + Advanced Tier (4.0–5.0).  
- Exercises 1.1–15.3 + Extras seeded.  
- Manual logging (no AI or video validation in MVP).  
- Coach Finder → static profiles, no booking system yet.  
- Admin CMS → create/update drills + coaches, publish instantly.  

---

## 8. 📊 Success Metrics

- % of players linking DUPR accounts.  
- % of players completing at least 1 exercise.  
- # of players unlocking Tier Badges (3.0, 4.0, 5.0 Ready).  
- # of coach profile views.  

---

## 10. 📘 Seed Curriculum (DUPR 2.0 → 5.0)

---

### 🌱 Beginner Tier (2.0 → 3.0)

**Level 1: Dinks (2.0–2.3)**  
- 1.1 Dink Wall Drill → 15 consecutive soft dinks.  
- 1.2 Cross-Court Dinks → 8 consecutive cross-court dinks.  
- 1.3 Dink Targets → 6/12 land in NVZ cones.  
- Extra 1E — Survivor Dinks (leaderboard).  

**Level 2: Drives (2.2–2.5)**  
- 2.1 FH Drive Depth → 7/10 beyond NVZ.  
- 2.2 BH Drive Depth → 6/10 beyond NVZ.  
- 2.3 Drive & Recover → 5-drive sequence (coach validation).  
- Extra 2E — Alt FH/BH Rally → 12 alternating shots.  

**Level 3: Serves (2.3–2.6)**  
- 3.1 Serve Consistency → 8/10 in service box.  
- 3.2 Deep Serve → 6/10 in back third.  
- 3.3 Corner Placement → 4/8 to corners.  
- Extra 3E — Pressure Serving → 10 in a row, restart if 2 misses.  

**Level 4: Returns (2.4–2.7)**  
- 4.1 Deep Return → 7/10 past midline.  
- 4.2 Return & Approach → Deep return + NVZ in 3 steps (6/10).  
- 4.3 Target Backhand → 5/10 to server’s backhand.  
- Extra 4E — Return Wars → First to 10 deep returns.  

**Level 5: NVZ Transition & Resets (2.6–3.0)**  
- 5.1 Baseline → NVZ Transition → Reach NVZ in 3 shots (6/10).  
- 5.2 Volley Control → 8/12 volleys into NVZ (coach validation).  
- 5.3 Reset Under Pressure → 5/10 blocked resets (coach validation).  
- Extra 5E — Approach Game → First to NVZ wins rally.  

---

### ⚡ Intermediate Tier (3.0 → 4.0)

**Level 6: Serve Upgrades (3.0–3.2)**  
- 6.1 Deep Serve Mastery → 7/10 in back third.  
- 6.2 Spin Serve → 5/10 with visible spin (coach validation).  
- 6.3 Serve Placement Drill → 4/6 to chosen corner.  
- Extra 6E — Ace Challenge → 3/10 unreturned serves.  

**Level 7: Third Shot Drop (3.1–3.3)**  
- 7.1 Drop Consistency → 6/10 into NVZ.  
- 7.2 Target Drops → 4/10 to backhand corner.  
- 7.3 Drop Under Pressure → 5/10 vs drives (coach validation).  
- Extra 7E — Drop Rally → Longest streak rally.  

**Level 8: Dink Pressure Play (3.2–3.5)**  
- 8.1 Extended Dink Rally → 15 cross-court without error.  
- 8.2 Dink Target Drill → 7/12 to target cones.  
- 8.3 Attackable vs Safe Dinks → 8/10 unattackable (coach validation).  
- Extra 8E — Dink Wars → Competitive dink mini-game.  

**Level 9: Volleys & Speed-Ups (3.4–3.7)**  
- 9.1 Volley Depth Control → 7/10 into NVZ.  
- 9.2 Speed-Up Drill → 5/10 speed-ups to body/backhand.  
- 9.3 Counter-Attack Drill → 6/10 counters (coach validation).  
- Extra 9E — Reflex Rally → Longest fast volley streak.  

**Level 10: Strategy Basics (3.5–4.0)**  
- 10.1 Doubles Positioning Test → 8/10 correct movements (coach validation).  
- 10.2 Partner Movement Drill → Correct shadowing in rally (coach validation).  
- 10.3 Target Weakness → 6/10 directed to weaker side.  
- Extra 10E — King of the Court → Rotating doubles competition.  

---

### 🔥 Advanced Tier (4.0 → 5.0)

**Level 11: Advanced Serve & Return (4.0–4.2)**  
- 11.1 Power Serve → 6/10 above 50 mph.  
- 11.2 Deep Slice Return → 6/10 deep slice returns.  
- 11.3 Return + NVZ Transition → 8/10 successful.  
- Extra 11E — Serve +1 Drill → Win point after serve.  

**Level 12: Reset Mastery (4.2–4.4)**  
- 12.1 Mid-Court Reset → 6/10 soft resets.  
- 12.2 Defensive Reset → 5/10 vs hard drive.  
- 12.3 Transition Zone Reset → 6/10 resets successful.  
- Extra 12E — Chaos Drill → Random feed resets.  

**Level 13: Attacking Game (4.4–4.6)**  
- 13.1 Speed-Up Targeting → 6/10 to BH/hip.  
- 13.2 Counter Speed-Up → 6/10 successful counters.  
- 13.3 Create Attack → 5/10 dink → speed-up → finish.  
- Extra 13E — First Attack Wins → Game mode.  

**Level 14: Doubles Tactics (4.6–4.8)**  
- 14.1 Stacking Drill → 8/10 correct formations (coach validation).  
- 14.2 Poaching Drill → 5/10 NVZ intercepts.  
- 14.3 Lob Defense → 5/10 successful recoveries.  
- Extra 14E — Scenario Scrimmages → Rotating doubles scenarios.  

**Level 15: Mental Game & Endurance (4.8–5.0)**  
- 15.1 Pressure Serving → 8/10 at simulated 10–10.  
- 15.2 Long Rally Endurance → 30+ shots.  
- 15.3 Shot Discipline → <2 errors in 10-point rally (coach validation).  
- Extra 15E — Tournament Simulation → Full 11-point match.  

---

# ✅ Notes
- **Core drills** (x3 per level) must be completed to unlock the next level.  
- **Extras** are optional challenges tied to leaderboards.  
- **Coach validation** is required for some drills at higher DUPR bands.  
- **Badges:** Completing all levels in a tier unlocks a Tier Badge (e.g., “3.0 Ready”, “4.0 Ready”, “5.0 Ready”).  
- **Official DUPR rating** is synced from DUPR API; PicklePro does not override DUPR.  
