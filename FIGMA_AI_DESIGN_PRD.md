# Pickleball Hero - Figma AI Design PRD
## Complete UI/UX Design Specification for Coach & Student Platform

---

## 🎯 Project Overview

**Product Name:** Pickleball Hero  
**Platform:** Mobile App (iOS & Android)  
**Design Tool:** Figma AI  
**Primary Goal:** Create a comprehensive coaching platform connecting pickleball students with certified coaches, featuring personalized training programs and skill assessments.

---

## 🎨 Design System & Brand Guidelines

### Color Palette
- **Primary Green:** #27AE60 (Success, CTAs, Active states)
- **Secondary Gray:** #F4F5F7 (Backgrounds, Cards)
- **Accent Orange:** #F39C12 (Highlights, Warnings)
- **Indigo:** #4F46E5 (Coach-specific actions, Links)
- **Text Primary:** #1F2937
- **Text Secondary:** #6B7280
- **Text Tertiary:** #9CA3AF
- **Error Red:** #EF4444
- **Success Green:** #10B981
- **Star Yellow:** #F59E0B

### Typography
- **Headers:** 28-32px, Bold (700)
- **Section Titles:** 18-20px, Semibold (600)
- **Body Text:** 14-16px, Regular (400)
- **Small Text:** 12px, Medium (500)
- **Button Text:** 16px, Semibold (600)

### Spacing System
- **Extra Small:** 4px
- **Small:** 8px
- **Medium:** 12px
- **Large:** 16px
- **Extra Large:** 24px
- **Section Padding:** 16-20px

### Component Style
- **Border Radius:** 12-16px (cards), 20-28px (buttons, chips)
- **Shadows:** Subtle elevation (0px 2px 8px rgba(0,0,0,0.05))
- **Card Style:** White background, rounded corners, subtle shadow
- **Icons:** Ionicons style, 20-24px for headers, 14-16px for inline

---

## 📱 STUDENT SIDE - User Flows & Screens

### 1. ONBOARDING FLOW (NEW USERS)

#### Screen 1: Welcome Screen
**Layout:**
- Full-screen hero image (pickleball court/players)
- Semi-transparent gradient overlay
- App logo at top center
- Welcome headline: "Welcome to Pickleball Hero"
- Subheadline: "Your journey to pickleball mastery starts here"
- Two large CTAs at bottom:
  - "I'm a Student" (Primary green button)
  - "I'm a Coach" (Secondary outlined button)

#### Screen 2: Student Onboarding - Step 1 (Profile Setup)
**Layout:**
- Progress indicator at top (Step 1 of 4)
- Header: "Let's Get Started"
- Subheader: "Tell us about yourself"
- Form fields:
  - Profile photo upload (circular, center, optional)
  - Full name input
  - Email input
  - Phone number input
  - Location/City input with location icon
- "Continue" button at bottom
- "Skip for now" link (tertiary)

#### Screen 3: Student Onboarding - Step 2 (Skill Level)
**Layout:**
- Progress indicator (Step 2 of 4)
- Header: "What's Your Experience?"
- Subheader: "Help us personalize your training"
- Visual skill selector cards:
  - **Newbie** - "Just starting out" (with beginner icon)
  - **Beginner** - "I know the basics" (with paddle icon)
  - **Intermediate** - "I play regularly" (with trophy icon)
  - **Advanced** - "I'm competitive" (with star icon)
  - **Pro** - "I compete professionally" (with medal icon)
- DUPR rating input (optional): "Enter your DUPR rating (optional)"
- "Continue" button
- "Back" link

#### Screen 4: Student Onboarding - Step 3 (First Assessment Intro)
**Layout:**
- Progress indicator (Step 3 of 4)
- Large illustration (assessment clipboard/checklist)
- Header: "Quick Skills Assessment"
- Description card:
  - "Let's evaluate your current skills"
  - "• Takes about 5 minutes"
  - "• No right or wrong answers"
  - "• Helps match you with the right coach"
  - "• Creates your personalized training plan"
- Two CTAs:
  - "Start Assessment" (Primary green, large)
  - "Skip for Now" (Secondary, smaller)

#### Screen 5: First Assessment - Question Screen
**Layout:**
- Progress bar at top (e.g., "3 of 8")
- Category badge: "Serve" / "Return" / "Dinking" / etc.
- Question number and category icon
- Large question text: "How comfortable are you with your serve?"
- Visual answer options (large tappable cards):
  - "Need Work" (1-2) - Red icon
  - "Getting Better" (3-4) - Yellow icon
  - "Comfortable" (5-6) - Light green icon
  - "Strong" (7-8) - Green icon
  - "Excellent" (9-10) - Dark green icon
- "Previous" and "Next" buttons
- "Save & Exit" link

#### Screen 6: First Assessment - Results
**Layout:**
- Celebration animation/confetti
- Header: "Assessment Complete! 🎉"
- Overall score card (large, centered):
  - Score number (e.g., "68/100")
  - Percentage with progress ring
  - Tier badge (e.g., "Intermediate")
- Breakdown by category (horizontal scroll cards):
  - Serve: 7/10 ⭐
  - Return: 6/10 ⭐
  - Dinking: 8/10 ⭐
  - Volley: 5/10 ⭐
  - etc.
- "What's Next" section:
  - "We've created a personalized training program"
  - "Browse coaches to accelerate your progress"
- Two CTAs:
  - "View My Program" (Primary)
  - "Find a Coach" (Secondary)

#### Screen 7: Onboarding - Step 4 (Goal Setting)
**Layout:**
- Progress indicator (Step 4 of 4)
- Header: "What Are Your Goals?"
- Subheader: "Select all that apply"
- Multi-select goal cards:
  - "Improve technique" 🎯
  - "Win tournaments" 🏆
  - "Stay fit and active" 💪
  - "Meet new people" 👥
  - "Play recreationally" 😊
  - "Become a pro" ⭐
- "Finish Setup" button
- "Back" link

---

### 2. STUDENT HOME SCREEN (Post-Onboarding)

#### Layout:
**Header Section:**
- Welcome message: "Hi [Name]! 👋"
- Current tier badge with level
- Quick stats row (3 cards):
  - Total workouts completed
  - Current streak (days)
  - Skill level

**Today's Program Section:**
- Section title: "Today's Training"
- Active program card:
  - Program thumbnail
  - Program name
  - Progress bar (e.g., "Day 5 of 30")
  - "Continue Training" CTA
- If no active program: "Browse Programs" CTA

**Quick Actions Section:**
- Section title: "Quick Actions"
- 2x2 grid of action cards:
  - "Find a Coach" (coach icon)
  - "Log Workout" (clipboard icon)
  - "View Progress" (chart icon)
  - "Assessment" (star icon)

**Recommended Coaches Section:**
- Section title: "Recommended Coaches Near You"
- Horizontal scroll of coach cards:
  - Coach photo (circular)
  - Name with verified badge
  - Rating stars
  - Price per hour
  - "Contact" button

**Bottom Navigation:**
- Home (house icon)
- Programs (library icon)
- Coaches (people icon)
- Logbook (clipboard icon)
- Profile (person icon)

---

### 3. FIND A COACH SCREEN (Main Discovery)

#### Layout:
**Header Section:**
- Title: "Certified Coaches"
- Search icon button (expands to search bar)

**Expandable Search Bar:**
- Search input: "Search coaches..."
- Clear button (X)

**Filter Chips (Horizontal Scroll):**
- Verified ✓
- Beginners
- Technique
- Strategy
- Mental Game
- Tournament Prep
- Fitness

**Sort Bar:**
- Label: "Sort by:" with settings icon
- Pill buttons: Rating | Price | Location
- Location shows lock icon if permission not granted

**Results Header:**
- "X coaches found"

**Coach Cards (Vertical Scroll):**
Each card contains:
- **Top Row:**
  - Circular avatar (tappable for full view)
  - Coach name with verified badge
  - Star rating (4.8)
  - Review count (23)
  - Price/hour (right-aligned)
    - Format: "$50" or "350k₫"
    - "per hour" label below

- **Bio Text:**
  - 2 lines max with ellipsis

- **Specialty Tags:**
  - Up to 3 tags shown (e.g., "Technique", "Strategy")
  - "+2" if more tags exist

- **Location Row:**
  - Location pin icon
  - City name
  - Distance (if location enabled): "• 2.5 mi away"

- **CTA Button:**
  - "Contact Coach" (full-width, primary indigo)

**Avatar Modal (on tap):**
- Full-screen dark overlay (90% opacity)
- Large circular image (300x300)
- Coach name below
- Verified badge if applicable
- Close button (top-right)

**Messaging Modal (on Contact):**
- Bottom sheet modal
- Title: "Message [Coach Name]"
- Description: "Choose your preferred messaging platform:"
- Messaging option cards:
  - WhatsApp (icon + label)
  - iMessage (icon + label)
  - Zalo (icon + label)
  - SMS (fallback, different style)
- Each card shows icon, name, description, chevron

**Pull-to-Refresh:**
- Standard pull-to-refresh with spinner

---

### 4. STUDENT PROFILE & SETTINGS

#### Profile Screen Layout:

**Header (Top Bar):**
- Back button (left): iOS chevron-back or Android arrow-back
- Title: "Profile" (centered)
- Empty space (right) for balance

**Profile Card Section:**
- **Avatar Container (96x96, circular):**
  - Tappable to upload new photo
  - If has avatar: Display image with cover fit
  - If no avatar: Initials (user's name first letters)
  - Upload overlay when uploading: "Uploading..."
  - Shadow effect with primary color glow
  
- **Name Display:**
  - Tappable to edit
  - Large text (22px, bold)
  - Centered

- **Email Display:**
  - Read-only
  - Smaller text (14px, gray)
  - 2 lines max with ellipsis
  - Centered

- **City Badge:**
  - Location icon + city name
  - Light background badge
  - Indigo color scheme
  - Only show if city exists

- **Student Code Display:**
  - "Student Code: [4-digit code]"
  - Special badge styling (light blue background)
  - Monospace font for code
  - Border and rounded corners
  - Only show if student code exists
  - Purpose: Coaches use this to add students

- **DUPR Rating Section:**
  - Label: "DUPR RATING"
  - Large rating display (24px, bold)
  - Format: x.xxx (e.g., 3.500)
  - Tappable to edit
  - "Sync DUPR" button with sync icon
  - Light background container with border

**Overall Statistics Section:**
- Section title: "Overall Statistics"
- 2x2 Grid layout:
  - Card 1: Levels Completed (currently shows "-")
  - Card 2: Days Active (calculated from first session)
  - Card 3: Exercises Done (currently shows "-")
  - Each card: White background, rounded, shadow
  - Large number (24px, bold, primary color)
  - Small label below

**Settings Section:**
- Section title: "Settings"
- **Admin Dashboard Button** (only if user is admin):
  - Light blue background (#F0F9FF)
  - Settings icon + "Admin Dashboard"
  - Blue text and icon
  - Chevron right
  
- **Create Coach Profile Button:**
  - Light green background (#F0FDF4)
  - Coach icon + "Create Your Coach Profile"
  - Green text and icon
  - Chevron right
  
- **App Settings:**
  - Settings icon + "App Settings"
  - Chevron right
  
- **Help & Support:**
  - Help icon + "Help & Support"
  - Chevron right
  
- **Logout:**
  - Light red background (#FEF2F2)
  - Logout icon + "Logout"
  - Red text and icon
  - Confirmation dialog on tap

**Delete Account Section:**
- Bottom link: "How do I delete my account"
- Small, gray, underlined text
- Opens delete account modal

**Modals:**

1. **Edit Name Modal:**
   - Title: "Edit Name"
   - Subtitle: "Enter your display name"
   - Text input (auto-focus, select all)
   - Validation: 2-50 characters
   - Cancel + Save buttons (side by side)

2. **Edit DUPR Modal:**
   - Title: "Edit DUPR Rating"
   - Subtitle: "Enter your rating in format x.xxx"
   - Numeric input (auto-focus, select all)
   - Format: x.xxx (1.000 to 8.000)
   - Center-aligned text
   - Cancel + Save buttons (side by side)

3. **Delete Account Modal (First Step):**
   - Title: "Delete Account"
   - Warning text: "Your data, logbook and programs will be deleted. Your account will be deleted permanently. You won't be able to restore your account and your data."
   - "Delete My Account" button (red)
   - "Cancel" button (gray)
   - Scrollable content

4. **Delete Confirmation Modal:**
   - Title: "Confirm Account Deletion"
   - Subtitle: "This action cannot be undone..."
   - Cancel button
   - Delete Account button (red)
   - Stacked vertically

---

## 👨‍🏫 COACH SIDE - User Flows & Screens

### 1. CREATE/EDIT COACH PROFILE SCREEN

**Access:** From Profile Settings → "Create Your Coach Profile" button

#### Header:
- Back button (left)
- Title: "Create Your Coach Profile" OR "Edit Your Coach Profile" (edit mode)
- Save/Update button (right, primary green)
- Shows loading spinner when saving

---

#### Intro Section:
- Large title: "Earn More with PicklePro"
- Description: "Share your pickleball expertise and help others improve their game. Fill out your profile to get started."

---

#### Form Section 1: Basic Information

**Full Name Field:**
- Label: "Full Name *"
- Required field
- Text input
- Auto-populated from auth user

**Email Address Field:**
- Label: "Email Address *"
- Required field, read-only (pre-filled)
- Grayed out/disabled appearance
- From authenticated user

**Phone Number Field:**
- Label: "Phone Number"
- **Country Detection:**
  - Auto-detects country from location or IP
  - Shows loading: "Detecting your country..."
  - Falls back to Vietnam if detection fails
  - Shows result: "📍 Auto-detected: [Country]" or "📱 Inferred from phone: [Country]"
  
- **Country Selector:**
  - Tappable button on left side of input
  - Shows flag emoji + dial code (e.g., "🇺🇸 +1" or "🇻🇳 +84")
  - Chevron down icon
  - Opens bottom sheet modal
  
- **Phone Input:**
  - Flex input field
  - Auto-formats as you type based on country:
    - US: (555) 123-4567
    - VN: 123 456 789
  - Placeholder shows format example
  
- **Validation Feedback:**
  - ✅ "Valid phone number" (green)
  - ❌ "Invalid phone number format" (red)

**Country Picker Modal:**
- Bottom sheet presentation
- Header: "Select Country"
- Cancel button
- List of countries:
  - 🇺🇸 United States (+1)
  - 🇻🇳 Vietnam (+84)
- Each option shows flag, name, dial code
- Checkmark on selected country
- Light green background when selected
- **Currency Auto-Conversion:**
  - When switching countries, hourly rate converts
  - Shows alert: "Currency Converted"
  - USD ↔ VND conversion (1 USD ≈ 24,000 VND)

**Messaging Preferences Section:**
- Label: "Preferred Messaging Apps *"
- Description: "Select how students can reach you. Choose at least one option."
- **Available Options (country-dependent):**
  - **WhatsApp:** Available in US & VN
    - WhatsApp icon image
    - "Message via WhatsApp"
    - Checkbox on right
  - **iMessage:** Available in US & VN
    - 💬 emoji icon
    - "Message via iMessage (iOS)"
    - Checkbox on right
  - **Zalo:** Only available in VN
    - Zalo icon image
    - "Message via Zalo"
    - Checkbox on right
- **Selection State:**
  - Unselected: White background, gray border
  - Selected: Light green background (#F0FDF4), green border (2px)
  - Green checkmark icon when selected
- **Validation:**
  - Must select at least one if phone provided
  - ⚠️ "Please select at least one messaging option" (red)
- **Country Note (for US coaches):**
  - Blue info box
  - "💡 Zalo is primarily used in Vietnam and is not available for US coaches"

**Bio Field:**
- Label: "Bio"
- Multi-line text area (4 lines)
- Placeholder: "Tell us about your background, experience, and coaching philosophy..."

---

#### Form Section 2: Professional Details

**DUPR Rating Field:**
- Label: "DUPR Rating"
- Auto-populated from user profile if exists
- Description: "Auto-populated from your profile. You can edit if needed (x.xxx format)" OR "Enter your rating in x.xxx format"
- Format: x.xxx (e.g., 4.125, 3.750)
- **Smart Input:**
  - Only allows numbers and decimal
  - One digit before decimal
  - Up to 3 digits after decimal
  - Range: 1.000 to 8.000
- **Live Validation:**
  - ✅ "Valid DUPR rating: 4.125" (green)
  - ❌ "Invalid format" or "Rating must be between 1.000 and 8.000" (red)

**Hourly Rate Field:**
- Label: "Hourly Rate ([currency symbol])"
- Description shows typical range:
  - USD: "Typical range: $30-150/hour"
  - VND: "Typical range: 300,000-1,500,000₫/hour"
- Numeric input
- Placeholder based on country (75 or 500000)
- **Live Validation:**
  - ✅ "Valid rate: [formatted]/hour" (green)
  - ❌ "Rate should be within typical range" (red)
- **Currency Display:**
  - USD: $75
  - VND: 500,000₫ (with thousand separators)

**Location Field:**
- Label: "Location"
- Text input
- Placeholder: "City, State"
- **Map Picker Button:**
  - Green outline button with location icon
  - Text varies by platform:
    - Android: "Get My Location" / "Update My Location"
    - iOS/Web: "Set Map Location" / "Update Map Location"
  - Shows loading: "Getting Location..."
  - Opens map picker modal (iOS/Web) or directly gets location (Android)
- **Location Summary (when set):**
  - Shows coordinates: "📍 10.7786, 106.7131"
  - Shows radius: "🎯 Coaching radius: 5km"

**Map Picker Modal (iOS/Web only):**
- Full-screen modal
- **Header:**
  - Cancel (left)
  - "Select Location" (center)
  - Confirm (right, green)
  
- **Debug Info (yellow banner, remove in production):**
  - Shows map region and temp coordinates
  
- **Map Display:**
  - **Web:** Embedded Google Maps iframe with marker
    - "Open in Google Maps" button overlay (top-right)
  - **iOS/Android:** Interactive MapView
    - Draggable marker
    - Tap map to move marker
    - Region updates on drag
  
- **Coordinate Inputs:**
  - Title: "📍 Set Location Coordinates"
  - Side-by-side inputs:
    - Latitude (left)
    - Longitude (right)
  - Decimal input, centered text
  - Updates map in real-time
  
- **Location Preview:**
  - Auto-reverse geocoding (1-second debounce)
  - Light green box with border
  - Shows loading: "Finding location..."
  - Displays: "Detected Location: Ho Chi Minh City, Vietnam"
  
- **Helper Text:**
  - Blue info box
  - "💡 Adjust the coordinates above to see the map and location update in real-time..."
  
- **Footer:**
  - "Use My Location" button (green outline)
    - Location icon
    - Shows loading spinner when active
    - Auto-reverse geocodes after getting location
  - Instructions: "Tap on the map to select your coaching location or drag the marker"

**Coaching Radius Field:**
- Label: "Coaching Radius"
- Description: "How far are you willing to travel for coaching sessions?"
- **Value Display:**
  - Large, centered, bold, green text
  - Format: "500m" or "5km"
- **Radius Options (horizontal scroll chips):**
  - Options: 0.5km (500m), 1km, 2km, 5km, 10km, 15km, 20km, 30km
  - Unselected: White background, gray border
  - Selected: Green background, white text
  - Rounded pill shape

**Specialties Field:**
- Label: "Specialties"
- Description: "Select your areas of expertise"
- **Multi-Select Chips:**
  - Options: Technique, Mental Game, Beginners, Advanced, Competition, Youth, Fitness, Strategy
  - Wrap layout (multiple rows)
  - Unselected: White background, gray border
  - Selected: Green background, white text
  - Rounded pill shape (20px radius)

---

#### Form Section 3: Availability & Visibility

**Available for New Students Toggle:**
- Checkbox with label
- Label: "Available for new students"
- Controls coach's active status
- Checked by default for new profiles

**Publish Profile Toggle:**
- Checkbox with label and description
- Label: "Publish my profile in the coach directory"
- Description: "When checked, your profile will be visible to students looking for coaches. You can change this anytime."
- **Key Feature:** Lets coaches create profile without publishing immediately
- Unchecked by default

---

#### Disclaimer Section:
- Light green info card
- Help icon (green)
- Title: "Profile Review & Publishing"
- Text: "Your coach profile will be reviewed by our team before it can be published. This typically takes 1-2 business days. You can choose to publish your profile in the coach directory once it's approved, or keep it private until you're ready."

---

#### Success Behavior:
- **If Publishing:** "Your coach profile has been [created/updated] successfully! It will be reviewed by our team before being published in the coach directory."
- **If Not Publishing:** "Your coach profile has been [created/updated] successfully! You can publish it in the coach directory anytime by updating your profile."
- Navigate back to previous screen

---

#### Technical Features:
- Edit mode detection: Checks for existing coach profile by email
- Auto-populates all fields in edit mode
- Country inference from existing phone format
- Multi-service reverse geocoding (Nominatim, BigDataCloud, Maps.co)
- Platform-specific location handling (web vs. mobile)
- Currency stored in cents for USD, as-is for VND
- Real-time validation and feedback
- Smart form state management

---

### 2. COACH DASHBOARD (Main Screen)

#### Layout:
**Header:**
- Title: "Coach Dashboard"
- Tabs:
  - Students (people icon)
  - Programs (library icon)
- Search bar:
  - "Search player by name or ID" (Students tab)
  - "Search programs" (Programs tab)

**STUDENTS TAB:**

**Students List:**
- Section title: "Students (X)"
- If empty:
  - Empty state illustration
  - "No students added yet"
  - "Add Your First Player" CTA

**Student Cards:**
Each card contains:
- **Header Row:**
  - Circular avatar (56px)
  - Student info:
    - Name
    - DUPR rating (if available)
    - Tier badge
    - Last assessment: "2 days ago" or "No assessment"
  - Large score display (right-aligned):
    - Last assessment score (36pt font)
- **Card is tappable** → navigates to Student Profile

**Empty State:**
- Icon: people-outline
- Text: "No students added yet"
- Button: "Add Your First Player"

**PROGRAMS TAB:**

**Programs List:**
- Section title: "Coach Programs (X)"
- If loading: Spinner + "Loading programs..."
- If error: Error icon + error message
- If empty:
  - Empty state illustration
  - "No coach programs available"

**Program Cards:**
Each card contains:
- Thumbnail (60x60, left)
- Program info:
  - Name
  - Description (2 lines max)
  - Category • Tier
- Chevron icon (right)
- Tappable → navigates to Program Detail

**Floating Action Button:**
- Position: Bottom-right (only on Students tab)
- Icon: Plus (+)
- Color: Primary green
- Action: Opens "Add Student" modal

**Add Student Modal:**
- Modal overlay
- Header: "Add New Student"
- Close button
- Description: "Enter the 4-digit student code to add a player to your roster."
- Input field:
  - Large centered input
  - Placeholder: "Enter 4-digit code"
  - Numeric keyboard
  - Monospace font with letter spacing
  - Max length: 4
- Buttons:
  - "Cancel" (outlined)
  - "Add Student" (primary, shows spinner when loading)

**Pull-to-Refresh:**
- Refresh students or programs based on active tab

---

### 3. STUDENT PROFILE (COACH VIEW)

#### Layout:
**Header:**
- Back button
- Title: "[Student Name]'s Profile"
- Action menu (3 dots)

**Profile Section:**
- Large avatar
- Name
- Student code (e.g., "ID: 1234")
- Contact info
- Tier badge

**Assessment History:**
- Section title: "Assessment History"
- Timeline of assessments:
  - Each assessment card shows:
    - Date
    - Score with percentage
    - Progress indicator
    - View details button
- "Start New Assessment" CTA (primary green)

**Program Progress:**
- Section title: "Active Programs"
- List of programs student is following:
  - Program name
  - Progress bar
  - Last workout date

**Notes Section:**
- Coach's private notes about student
- "Add Note" button
- Note list (chronological)

**Action Buttons:**
- "Assign Program"
- "Message Student"
- "Remove Student" (danger, in menu)

---

### 4. ASSESSMENT FLOW (COACH ADMINISTERING)

#### Screen 1: Assessment Type Selection
**Layout:**
- Header: "New Assessment for [Student Name]"
- Description: "Choose assessment type"
- Two large option cards:
  - **First Time Assessment**
    - Icon: clipboard with star
    - Description: "Initial skills evaluation"
    - "This is their first assessment"
  - **Progress Assessment**
    - Icon: trending up
    - Description: "Track skill improvement"
    - "They've been assessed before"

#### Screen 2: Assessment Questions
**Layout:**
- Progress bar (e.g., "3 of 8")
- Category badge and icon
- Question text
- Skill name: "Serve Consistency"
- Score slider or buttons (1-10 scale):
  - Visual feedback with colors
  - Number display
- Optional notes field per question
- "Previous" and "Next" buttons

#### Screen 3: Assessment Complete
**Layout:**
- Success animation
- Header: "Assessment Complete! 🎉"
- Student name
- Overall score card:
  - Total score (e.g., "68/100")
  - Percentage
  - Change from last assessment (+5%)
- Category breakdown (chart or list)
- Two CTAs:
  - "Share Results with Student"
  - "Back to Dashboard"

---

### 5. COACH PROGRAM MANAGEMENT

#### Program Detail Screen (Coach View):
**Layout:**
- Program thumbnail (full-width header)
- Program name
- Category and Tier badges
- Description
- "Assign to Student" CTA
- Routines list (expandable):
  - Each routine shows:
    - Name
    - Time estimate
    - Exercise count
  - Tap to expand exercises

**Assign Program Modal:**
- Search students
- Select multiple students
- "Assign Program" button
- Success confirmation

---

## 🔄 Shared Screens (Both Sides)

### 1. PROGRAMS LIBRARY SCREEN

#### Layout:
**Header:**
- Title: "Training Programs"
- Search icon

**Filter Section:**
- Category pills (horizontal scroll):
  - All, Skill Development, Drills, Fitness, Strategy, etc.
- Tier filter:
  - All, Newbie, Beginner, Intermediate, Advanced, Pro

**Programs Grid:**
- 2-column grid (or vertical list)
- Each program card:
  - Thumbnail image
  - Name
  - Short description
  - Tier badge
  - Rating stars
  - "X people added"
  - "Add to My Programs" button (students)
  - "Assign" button (coaches)

### 2. PROGRAM DETAIL SCREEN

#### Layout:
**Header:**
- Back button
- Program thumbnail (full-width)
- Overlay gradient
- Title on image

**Info Section:**
- Program name (large)
- Category • Tier
- Description (expandable)
- Rating and reviews
- Duration estimate

**Routines Section:**
- Section title: "Routines"
- Accordion-style list:
  - Each routine expandable
  - Shows exercises when expanded
  - Exercise details: name, type, target value

**Action Buttons:**
- "Start Program" (student)
- "Assign to Student" (coach)
- Share button

### 3. LOGBOOK / WORKOUT HISTORY

#### Layout:
**Header:**
- Title: "My Logbook"
- Filter icon
- Calendar icon

**Timeline View:**
- Chronological list of workouts
- Each entry shows:
  - Date
  - Program name
  - Exercises completed
  - Duration
  - Notes
- Tap to expand details

**Stats Summary:**
- Weekly/monthly view toggle
- Charts:
  - Workouts per week
  - Total time trained
  - Favorite exercises

---

## 🎬 Key Interactions & Animations

### Micro-interactions:
1. **Button Press:** Scale to 95%, slight shadow increase
2. **Card Tap:** Subtle elevation increase, scale to 98%
3. **Toggle Switches:** Smooth slide animation with color transition
4. **Tab Switch:** Fade content, slide new content from side
5. **Modal Open:** Slide up from bottom (bottom sheet) or fade in (center modal)
6. **Modal Close:** Reverse of open animation
7. **Loading States:** Skeleton screens with shimmer effect
8. **Pull-to-Refresh:** Standard iOS/Android refresh with custom color
9. **Success Actions:** Green checkmark animation + haptic feedback
10. **Error States:** Shake animation + error color

### Page Transitions:
- **Navigation Stack:** Slide from right (push), slide to right (pop)
- **Tab Navigation:** Cross-fade, no slide
- **Modal Presentation:** Slide up or fade with overlay

---

## 📐 Screen Sizes & Responsive Design

### Target Devices:
- iPhone SE (375x667) - minimum size
- iPhone 13/14 (390x844) - primary design target
- iPhone 14 Pro Max (430x932) - test for scaling
- Android (360x800+) - various sizes

### Responsive Rules:
- Use flexible layouts with min/max widths
- Stack elements vertically on smaller screens
- Maintain 16-20px side margins
- Scale font sizes proportionally
- Ensure touch targets are min 44x44px
- Test with both notched and non-notched screens
- Account for safe area insets

---

## 🎯 Key User Journeys to Design

### Student Journey 1: New User Onboarding
1. Open app → Welcome screen
2. Select "I'm a Student"
3. Complete profile (name, email, phone, location)
4. Select skill level
5. See first assessment intro
6. Complete 8-question assessment
7. View results and breakdown
8. Set goals
9. Land on home screen with recommended program

### Student Journey 2: Finding & Contacting a Coach
1. Home screen → Tap "Find a Coach" or use bottom nav
2. Browse coach list
3. Filter by "Beginners" + Sort by "Location"
4. Scroll through results
5. Tap coach avatar to view full photo
6. Read coach bio and reviews
7. Tap "Contact Coach"
8. Select WhatsApp from modal
9. Opens WhatsApp with pre-filled message

### Coach Journey 1: Adding a Student
1. Coach Dashboard → Students tab
2. Tap floating "+" button
3. Enter student code (e.g., 1234)
4. Tap "Add Student"
5. See success message
6. Student appears in list

### Coach Journey 2: Conducting Assessment
1. Student Profile → "Start New Assessment"
2. Select "Progress Assessment"
3. Go through 8 questions, rate each skill
4. Add notes per question
5. Submit assessment
6. View results with comparison to previous
7. Share results with student

### Student Journey 3: Managing Profile
1. Bottom nav → Profile tab
2. View profile with avatar, stats, settings
3. Tap avatar → Select photo → Crop image → Upload
4. Tap DUPR rating → Edit modal → Enter 4.125 → Save
5. Tap name → Edit modal → Change name → Save
6. Scroll to settings → View available options
7. See student code displayed for coach access

### Coach Journey 3: Creating Coach Profile
1. Profile → "Create Your Coach Profile"
2. **Country Detection:**
   - System auto-detects country (US/VN)
   - Shows "📍 Auto-detected: Vietnam"
3. **Basic Info:**
   - Name pre-filled
   - Email pre-filled (disabled)
   - Phone: Select country flag → Enter number
   - Auto-formats as typing: "123 456 789"
   - Shows ✅ "Valid phone number"
4. **Messaging Preferences:**
   - See available apps for country
   - Select WhatsApp ✓
   - Select Zalo ✓
   - Card turns green when selected
5. **Bio:** Enter coaching experience
6. **Professional Details:**
   - DUPR: Auto-filled from profile (4.125)
   - Hourly Rate: Enter 500000 (VND)
   - Shows ✅ "Valid rate: 500,000₫/hour"
7. **Location:**
   - Tap "Get My Location" (Android)
   - Or "Set Map Location" (iOS)
   - Android: Directly gets GPS location
   - iOS: Opens map picker modal
   - Select location on map OR enter coordinates
   - Auto-reverse geocodes: "Ho Chi Minh City, Vietnam"
   - Confirm
8. **Coaching Radius:**
   - See current: "5km"
   - Tap different chip: "10km"
9. **Specialties:**
   - Tap: Technique, Strategy, Beginners
   - Chips turn green
10. **Availability:**
    - Check "Available for new students" ✓
    - Check "Publish in coach directory" ✓
11. **Tap Save:**
    - Shows loading spinner
    - Success: "Profile created! Will be reviewed..."
    - Navigate back

### Student Journey 4: Deleting Account
1. Profile → Scroll to bottom
2. Tap "How do I delete my account"
3. Read warning modal
4. Tap "Delete My Account"
5. Confirmation modal appears
6. Tap "Delete Account" again
7. Account and all data deleted
8. Signed out, returned to intro

---

## 📋 Component Library to Design

### Buttons:
- Primary (green filled)
- Secondary (outlined)
- Tertiary (text only)
- Danger (red)
- Icon buttons
- Floating action button

### Cards:
- Coach card (detailed)
- Student card (for coach dashboard)
- Program card (grid and list versions)
- Stat card (small, summary)
- Assessment card (timeline)

### Form Elements:
- Text input (standard)
- Text area (multi-line)
- Number input
- **Phone input with country selector:**
  - Left section: Country flag + dial code + chevron
  - Right section: Formatted phone input
  - Auto-formatting based on country
  - Validation feedback below
- **Country selector bottom sheet:**
  - Country option rows with flag, name, dial code
  - Checkmark on selected
  - Light green highlight when selected
- Search input
- Dropdown/select
- **Multi-select chips (specialties, radius, etc.):**
  - Unselected: White bg, gray border
  - Selected: Green bg, white text
  - Wrap layout for multiple rows
- **Messaging preference cards:**
  - Large selectable cards
  - Icon/emoji + name + description
  - Checkbox on right
  - Selected: Green border (2px), light green bg
- **Avatar uploader:**
  - Circular container (96x96)
  - Tap to upload
  - Show initials if no image
  - Upload overlay with "Uploading..." text
  - Image cropper integration
- Toggle switch
- Checkbox (24x24 with checkmark)
- Slider (for assessment scoring)
- **Radius selector chips:**
  - Horizontal scrollable
  - Options: 500m, 1km, 2km, 5km, 10km, 15km, 20km, 30km
  - Selected: Green bg, white text
  - Large value display above

### Navigation:
- Bottom tab bar (5 tabs)
- Top header with back button
- Top tabs (2-3 tabs, e.g., Students/Programs)
- Breadcrumbs (if nested navigation)

### Modals:
- Bottom sheet (messaging options, actions, country picker)
- Center modal (confirmations, forms, edit name/DUPR)
- Full-screen modal (image viewer, map picker, avatar zoom)
- **Map Picker Modal (iOS/Web):**
  - Header: Cancel | Title | Confirm
  - Map view (embedded iframe on web, MapView on mobile)
  - Draggable marker
  - Coordinate input fields (lat/long)
  - Location preview with auto-geocoding
  - "Use My Location" button
  - Helper text and instructions
- **Country Picker Bottom Sheet:**
  - Header with cancel button
  - List of countries with flags
  - Selection indicator
- **Delete Account Modals:**
  - Warning modal (scrollable)
  - Confirmation modal (destructive action)

### Lists & Data:
- Vertical list with dividers
- Grid layout (2 columns)
- Horizontal scroll (chips, coaches)
- Accordion/expandable items
- Timeline view

### Feedback:
- Loading spinner
- Skeleton screens
- Empty states
- Error states
- Success animations
- Toast notifications
- Progress bars
- Progress rings

### Icons Set:
- **Navigation:** home, library, people, clipboard, person, arrow-back, chevron-back, chevron-forward, chevron-down
- **Actions:** add, search, filter, sort, settings, close, back, edit (pencil), sync, upload, camera
- **Status:** checkmark, star, verified, lock, location, alert, info, help, success, error
- **Social:** WhatsApp (image), iMessage (💬), Zalo (image), SMS (💬)
- **Sports:** paddle, trophy, medal, target
- **Profile:** person, coach, admin, logout
- **Map/Location:** location-outline, locate (GPS), open-outline
- **Messaging:** phone, email, message
- **Validation:** checkmark-circle (green), close-circle (red), warning

---

## 🚀 Figma AI Prompt Template

Use this prompt structure when generating screens:

```
Design a mobile app screen for Pickleball Hero, a coaching platform.

SCREEN: [Screen Name]
STYLE: Modern, clean, fitness/sports theme
COLORS: Primary green #27AE60, Secondary gray #F4F5F7, Accent orange #F39C12
LAYOUT: [Describe layout sections]

COMPONENTS:
- [List specific components needed]

CONTENT:
- [List text content and labels]

INTERACTIONS:
- [Describe key interactions]

NOTES:
- Use rounded corners (12-16px)
- Include subtle shadows
- 16-20px padding
- Target iPhone 13 size (390x844)
- Safe area insets for notch
```

### Example Prompt: Student Profile Screen

```
Design a mobile app screen for Pickleball Hero, a pickleball coaching platform.

SCREEN: Student Profile Screen
STYLE: Modern, clean, professional fitness app aesthetic
COLORS: 
- Primary: #6366F1 (Indigo blue)
- Green: #27AE60
- Red: #EF4444
- Gray background: #F9FAFB
- White cards

LAYOUT:
1. Top header bar with back button, "Profile" title (centered), empty right space
2. Large profile card with white background and shadow
3. Statistics section with 2x2 grid of stat cards
4. Settings section with list of options
5. Bottom link for delete account

PROFILE CARD COMPONENTS:
- Circular avatar (96x96) at center top with shadow
- Display initials "SJ" in bold white text on purple background (#6366F1)
- Name "Sarah Johnson" below avatar (22px, bold)
- Email "sarah.j@email.com" below name (14px, gray)
- Blue badge with location icon: "📍 San Francisco"
- Light blue badge: "Student Code: 1234" (monospace font)
- DUPR rating section:
  - Light gray container with border
  - Label "DUPR RATING" (small, uppercase)
  - Large rating "3.500" (24px, bold)
  - "Sync DUPR" button with refresh icon

STATISTICS SECTION:
- Title "Overall Statistics"
- 2x2 grid of white cards with shadows
- Each card shows:
  - Large number (24px, bold, indigo)
  - Small label below (gray)
- Cards: "- Levels", "45 Days", "- Exer.", "[empty]"

SETTINGS SECTION:
- Title "Settings"
- White cards with icons and labels:
  1. Light blue bg: "⚙️ Admin Dashboard →" (only for admins)
  2. Light green bg: "👨‍🏫 Create Coach Profile →"
  3. White: "⚙️ App Settings →"
  4. White: "❓ Help & Support →"
  5. Light red bg: "🚪 Logout" (no arrow)

BOTTOM:
- Small gray underlined link: "How do I delete my account"

INTERACTIONS:
- Avatar is tappable to upload new photo
- Name tappable to edit
- DUPR rating tappable to edit
- Each settings item navigates to respective screen
- Logout shows confirmation dialog

NOTES:
- Use rounded corners (12-16px for cards)
- Subtle shadows on all white cards
- 16-20px padding throughout
- Target iPhone 13 size (390x844)
- Safe area insets at top
- Professional, trustworthy feel
```

### Example Prompt: Create Coach Profile Screen

```
Design a mobile app screen for Pickleball Hero, a coaching marketplace platform.

SCREEN: Create Coach Profile Screen
STYLE: Modern form design, clean, professional
COLORS: 
- Primary green: #059669
- Light green: #F0FDF4 (backgrounds)
- Gray: #F9FAFB (page background)
- White (card backgrounds)

LAYOUT: Scrollable form with sections
1. Header: Back button | "Create Coach Profile" | Save button (green)
2. Intro section with title and description
3. Form sections with clear titles
4. Disclaimer card at bottom

INTRO SECTION:
- Large title: "Earn More with PicklePro" (24px, bold)
- Subtitle: "Share your pickleball expertise and help others improve their game."

FORM SECTION 1: BASIC INFORMATION

Phone Number Field:
- Label "Phone Number"
- Small text: "📍 Auto-detected: United States"
- Split input:
  - Left: Country selector button [🇺🇸 +1 ↓]
  - Right: Formatted input "(555) 123-4567"
- Below: "✅ Valid phone number" (green text)

Messaging Preferences:
- Label "Preferred Messaging Apps *"
- Description text
- Three large selectable cards:
  1. WhatsApp card:
     - WhatsApp icon (green, rounded)
     - "WhatsApp" title
     - "Message via WhatsApp" subtitle
     - Checkbox on right (checked = green checkmark)
     - SELECTED STATE: Light green background, 2px green border
  2. iMessage card (similar, with 💬 emoji)
  3. Zalo card (similar, with Zalo icon)

FORM SECTION 2: PROFESSIONAL DETAILS

DUPR Rating Field:
- Input showing "4.125"
- Below: "✅ Valid DUPR rating: 4.125" (green)

Hourly Rate Field:
- Label "Hourly Rate ($)"
- Small text: "Typical range: $30-150/hour"
- Input "75"
- Below: "✅ Valid rate: $75/hour" (green)

Location Field:
- Text input
- Green outline button: "📍 Get My Location"
- Summary below:
  - "📍 37.7749, -122.4194"
  - "🎯 Coaching radius: 5km"

Coaching Radius:
- Title "Coaching Radius"
- Large centered value "5km" (green, bold)
- Horizontal scrollable chips:
  - [500m] [1km] [2km] [5km-selected] [10km] [15km] [20km] [30km]
  - Selected chip: green background, white text

Specialties:
- Multi-select chips wrapping:
  - [Technique-selected] [Mental Game-selected] [Beginners-selected]
  - [Advanced] [Competition] [Youth]
  - [Fitness] [Strategy]
  - Selected: green bg, white text

SECTION 3: AVAILABILITY
- [✓] Available for new students (checked)
- [ ] Publish in coach directory (unchecked)
  - Description text below

DISCLAIMER:
- Light green card with border
- Info icon (green)
- Title "Profile Review & Publishing"
- Body text about review process

INTERACTIONS:
- Country selector opens bottom sheet modal
- Messaging cards toggle selection (green highlight + checkmark)
- Map button opens location picker
- Radius chips toggle selection
- Specialty chips toggle selection
- Save button shows spinner when processing

NOTES:
- All form fields have 12px border radius
- Cards have subtle shadows
- Green (#059669) for primary actions
- Real-time validation feedback
- Clear visual hierarchy
- Form feels professional and trustworthy
```

---

## ✅ Design Checklist

### Before You Start:
- [ ] Review this entire PRD
- [ ] Understand user flows
- [ ] Set up design system/tokens in Figma
- [ ] Create reusable components

### For Each Screen:
- [ ] Design at 390x844 (iPhone 13)
- [ ] Include safe area guides
- [ ] Use consistent spacing (8px grid)
- [ ] All text is readable (min 12px)
- [ ] Touch targets min 44x44px
- [ ] Include all states (default, active, disabled, loading, error)
- [ ] Add loading and empty states
- [ ] Show navigation elements
- [ ] Include status bar
- [ ] Add home indicator (for notched phones)

### After First Draft:
- [ ] Create prototype connections
- [ ] Add transitions between screens
- [ ] Test user flows
- [ ] Review accessibility (contrast, size)
- [ ] Ensure consistency across screens
- [ ] Export assets and specs

---

## 📤 Deliverables

1. **Figma File** with:
   - Design system (colors, typography, components)
   - All screens designed at 1x (390x844)
   - Component library
   - Interactive prototype
   - Screen flows annotated

2. **Screen States:**
   - Default state
   - Loading state
   - Empty state
   - Error state
   - Success state

3. **Prototype:**
   - Key user journeys linked
   - Transitions defined
   - Clickable prototype ready for testing

4. **Design Specs:**
   - Spacing measurements
   - Font sizes and weights
   - Color codes
   - Asset export requirements

---

## 🎉 Success Criteria

Your design is successful when:
- ✅ Student onboarding is clear and engaging
- ✅ Coach discovery is intuitive and visual
- ✅ Assessment flow is simple for both coach and student
- ✅ Dashboard provides quick access to key actions
- ✅ All interactions feel smooth and native
- ✅ Design system is consistent across all screens
- ✅ Empty states are friendly and actionable
- ✅ Loading states prevent confusion
- ✅ Error messages are helpful
- ✅ Navigation is intuitive
- ✅ Users can complete core tasks in < 3 taps

---

## 📞 Priority Screens (Phase 1)

If designing in phases, prioritize these screens first:

### Must Have (MVP):
1. **Student Onboarding (all 7 screens)**
   - Welcome screen
   - Profile setup
   - Skill level selection
   - First assessment intro
   - Assessment questions
   - Results screen
   - Goal setting

2. **Student Home Screen**
   - Today's program
   - Quick actions
   - Recommended coaches

3. **Student Profile & Settings**
   - Avatar with upload
   - Name/email/city display
   - Student code display
   - DUPR rating editor
   - Statistics dashboard
   - Settings menu
   - Delete account flow

4. **Find a Coach Screen (with all modals)**
   - Search & filters
   - Sort by location/price/rating
   - Coach cards
   - Avatar zoom modal
   - Messaging options modal

5. **Create/Edit Coach Profile**
   - Country detection
   - Phone with country selector
   - Messaging preferences
   - DUPR & hourly rate
   - Map picker (platform-specific)
   - Coaching radius selector
   - Specialties multi-select
   - Publish toggle

6. **Coach Dashboard (Students & Programs tabs)**
   - Student list with scores
   - Add student modal
   - Programs tab
   - Pull-to-refresh

7. **Student Profile (Coach View)**
   - Student details
   - Assessment history
   - Program progress

8. **Assessment Flow (Coach side, 3 screens)**
   - Type selection
   - Question screens
   - Results with comparison

### Should Have (Phase 2):
9. Program Library & Detail
10. Logbook Screen
11. Program Assignment Flow
12. App Settings Screen
13. Help & Support Screen

### Nice to Have (Phase 3):
14. Advanced filtering
15. Coach reviews/ratings
16. In-app messaging
17. Calendar/scheduling
18. Payment integration
19. Admin Dashboard

---

## 🎨 Example Screen Layouts (ASCII Wireframes)

### Student Home Screen:
```
┌─────────────────────────────────────┐
│  ☰  Pickleball Hero          [👤]  │ ← Header
├─────────────────────────────────────┤
│  Hi Sarah! 👋                       │
│  Intermediate  ⭐                   │
│                                     │
│  [🏆 Stats] [🔥 Streak] [📊 Level] │ ← Stats
│                                     │
│  Today's Training                   │
│  ┌──────────────────────────────┐  │
│  │ [📷] Ben Johns Program       │  │
│  │ Day 5 of 30 ████░░░░ 17%     │  │ ← Program Card
│  │ [Continue Training →]        │  │
│  └──────────────────────────────┘  │
│                                     │
│  Quick Actions                      │
│  ┌──────┐ ┌──────┐                 │
│  │ 👨‍🏫 │ │ 📋  │                 │ ← Action Grid
│  │Coach│ │ Log  │                 │
│  └──────┘ └──────┘                 │
│  ┌──────┐ ┌──────┐                 │
│  │ 📈  │ │ ⭐   │                 │
│  │Chart│ │ Test │                 │
│  └──────┘ └──────┘                 │
│                                     │
│  Recommended Coaches →              │
│  [Coach] [Coach] [Coach] [Coach]   │ ← Horizontal Scroll
│                                     │
├─────────────────────────────────────┤
│ [🏠] [📚] [👥] [📋] [👤]          │ ← Bottom Nav
└─────────────────────────────────────┘
```

### Coach Dashboard (Students Tab):
```
┌─────────────────────────────────────┐
│  ← Coach Dashboard                  │ ← Header
├─────────────────────────────────────┤
│  [Students] [Programs]              │ ← Tabs
│                                     │
│  🔍 Search player by name or ID     │ ← Search
│                                     │
│  Students (5)                       │
│                                     │
│  ┌──────────────────────────────┐  │
│  │ [👤] John Doe                │  │
│  │      DUPR: 3.5 • Beginner    │  │
│  │      Last: 2 days ago        68 │ ← Student Card
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ [👤] Jane Smith              │  │
│  │      DUPR: 4.2 • Intermediate│  │
│  │      No assessment           -- │
│  └──────────────────────────────┘  │
│                                     │
│                              [+]    │ ← FAB
└─────────────────────────────────────┘
```

### Student Profile Screen:
```
┌─────────────────────────────────────┐
│  ←  Profile                    [ ]  │ ← Header
├─────────────────────────────────────┤
│  ╔═══════════════════════════════╗  │
│  ║                               ║  │
│  ║         [👤 Avatar]          ║  │ ← Profile Card
│  ║                               ║  │
│  ║      Sarah Johnson 📝         ║  │
│  ║   sarah.j@email.com           ║  │
│  ║   📍 San Francisco            ║  │
│  ║   Student Code: 1234          ║  │
│  ║                               ║  │
│  ║   ┌─────────────────────┐    ║  │
│  ║   │ DUPR RATING         │    ║  │
│  ║   │      3.500 📝       │    ║  │
│  ║   │  [Sync DUPR 🔄]     │    ║  │
│  ║   └─────────────────────┘    ║  │
│  ╚═══════════════════════════════╝  │
│                                     │
│  Overall Statistics                 │
│  ┌──────┐ ┌──────┐                 │
│  │  -   │ │  45  │                 │ ← Stats Grid
│  │Levels│ │ Days │                 │
│  └──────┘ └──────┘                 │
│  ┌──────┐ ┌──────┐                 │
│  │  -   │ │      │                 │
│  │Exer. │ │      │                 │
│  └──────┘ └──────┘                 │
│                                     │
│  Settings                           │
│  ┌──────────────────────────────┐  │
│  │ ⚙️ Admin Dashboard       →  │  │ ← Admin Only
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 👨‍🏫 Create Coach Profile  →  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ ⚙️ App Settings          →  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ ❓ Help & Support        →  │  │
│  └──────────────────────────────┘  │
│  ┌──────────────────────────────┐  │
│  │ 🚪 Logout                    │  │ ← Red
│  └──────────────────────────────┘  │
│                                     │
│  How do I delete my account         │ ← Link
└─────────────────────────────────────┘
```

### Create Coach Profile Screen:
```
┌─────────────────────────────────────┐
│  ←  Create Coach Profile   [Save]   │ ← Header
├─────────────────────────────────────┤
│  Earn More with PicklePro           │ ← Intro
│  Share your pickleball expertise... │
│                                     │
│  Basic Information                  │
│  ┌─────────────────────────────┐   │
│  │ Full Name *                 │   │
│  │ [John Doe              ]    │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Email Address *             │   │
│  │ [john@email.com        ]    │   │ ← Disabled
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Phone Number                │   │
│  │ 📍 Auto-detected: US        │   │
│  │ ┌──────┬─────────────────┐  │   │
│  │ │🇺🇸+1↓│(555) 123-4567   │  │   │ ← Country Selector
│  │ └──────┴─────────────────┘  │   │
│  │ ✅ Valid phone number       │   │
│  └─────────────────────────────┘   │
│                                     │
│  Preferred Messaging Apps *         │
│  ┌─────────────────────────────┐   │
│  │ [📱] WhatsApp         [✓]   │   │ ← Selected
│  │ Message via WhatsApp        │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 💬 iMessage           [ ]   │   │
│  │ Message via iMessage (iOS)  │   │
│  └─────────────────────────────┘   │
│                                     │
│  Professional Details               │
│  ┌─────────────────────────────┐   │
│  │ DUPR Rating                 │   │
│  │ [4.125              ]       │   │
│  │ ✅ Valid DUPR rating: 4.125 │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Hourly Rate ($)             │   │
│  │ Typical: $30-150/hour       │   │
│  │ [75                 ]       │   │
│  │ ✅ Valid rate: $75/hour     │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ Location                    │   │
│  │ [San Francisco, CA  ]       │   │
│  │ [📍 Get My Location    ]    │   │ ← Platform-aware
│  │ 📍 37.7749, -122.4194       │   │
│  │ 🎯 Coaching radius: 5km     │   │
│  └─────────────────────────────┘   │
│                                     │
│  Coaching Radius                    │
│  How far will you travel?           │
│            5km                      │ ← Large display
│  [500m][1km][2km][5km][10km]...    │ ← Chip selector
│                                     │
│  Specialties                        │
│  Select your areas of expertise     │
│  [Technique][Mental][Beginners]     │ ← Multi-select chips
│  [Advanced][Competition][Youth]     │
│  [Fitness][Strategy]                │
│                                     │
│  Availability & Visibility          │
│  [✓] Available for new students     │
│  [ ] Publish in coach directory     │
│      When checked, profile is       │
│      visible to students...         │
│                                     │
│  ╔═══════════════════════════════╗  │
│  ║ ℹ️ Profile Review & Publishing║  │ ← Info Card
│  ║ Your coach profile will be    ║  │
│  ║ reviewed by our team...       ║  │
│  ╚═══════════════════════════════╝  │
└─────────────────────────────────────┘
```

---

**Ready to design? Use this PRD with Figma AI or hand off to your design team!** 🎨🚀

