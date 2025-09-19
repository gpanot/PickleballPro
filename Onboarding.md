# 🎾 PicklePro Onboarding Flow

This document defines the **onboarding experience** after login & rating selection.  
Goal: make the app feel like a **personal training plan**, not generic drills.

---

## 🔐 Step 0: Login & Rating
1. **Login Screen**  
   - Options: Email (Supabase Auth), DUPR login (OAuth/manual entry), Guest.  

2. **Rating Setup**  
   - Path A: *I have a DUPR account* → enter/import rating (2.0–8.0).  
   - Path B: *I don’t have a DUPR account* → self-rate (2.0–4.0) or Skip → defaults to 2.0 Beginner.  

---

## 🏋️ Step 1: Training Goal
**Headline:** “What’s your pickleball goal?”  
**Options:**  
- 🏆 Improve my DUPR rating  
- 🎯 Learn the basics (Zero → 3.0)  
- ⚡ Get more consistent in matches  
- 💪 Compete in tournaments  

---

## ⏱ Step 2: Time Commitment
**Headline:** “How often can you train?”  
**Options:**  
- ⏱ 1–2 hours per week  
- ⏱ 3–4 hours per week  
- ⏱ 5+ hours per week  

---

## 🎯 Step 3: Focus Areas
**Headline:** “Where do you want to improve most?”  
**Options (multi-choice):**  
- 🥒 Dinks & control  
- 🎾 Serves & returns  
- 🚀 Power & attacking  
- 🧠 Strategy & positioning  

---

## 👩‍🏫 Step 4: Coaching Preference
**Headline:** “Do you want a coach?”  
**Options:**  
- 👩‍🏫 Yes, I want coach recommendations  
- 🤹 Not now, I’ll train solo  

---

## 🎯 Output of Onboarding
At the end of onboarding, we store:  
- `rating_source`: `dupr|self|skip`  
- `goal`: one of `dupr|basics|consistency|tournament`  
- `time_commitment`: `low|medium|high`  
- `focus`: array of focus tags (e.g., `["dinks","power"]`)  
- `coach_preference`: `yes|no`  

---

## 🧭 Flow Recap
1. **Login**  
2. **Rating selection** (DUPR / Self / Skip)  
3. **Goal screen**  
4. **Time commitment**  
5. **Focus areas**  
6. **Coaching preference**  
7. → **Home Dashboard** (personalized training plan based on responses).  

---

## ✅ Why This Works
- Feels like a **gym onboarding** (personal plan).  
- Personalizes drills immediately.  
- Encourages DUPR sync while not blocking new players.  
- Upsell opportunity → coach finder.  

---

## 🚀 Implementation Status
✅ **COMPLETED** - All 4 onboarding screens have been implemented with modern UI:

### 📱 Screen Files Created:
- `src/screens/TrainingGoalScreen.js` - Training goal selection with 4 options
- `src/screens/TimeCommitmentScreen.js` - Time commitment with 3 options  
- `src/screens/FocusAreasScreen.js` - Multi-select focus areas (2x2 grid)
- `src/screens/CoachingPreferenceScreen.js` - Coach preference with benefits

### 🧭 Navigation Flow:
- `src/navigation/OnboardingNavigator.js` - Sequential navigation between screens
- Updated `App.js` - Integrated onboarding flow after rating selection
- Updated `UserContext.js` - Added onboarding data storage

### 🎨 UI Features:
- Consistent purple gradient background (`#4F46E5` → `#7C3AED`)
- Modern card-based selection with hover states
- Emoji icons with selection indicators  
- Smooth transitions between screens
- Progress tracking with selection counts
- Responsive button states
