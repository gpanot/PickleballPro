# Coach Dashboard Setup Guide

## 📋 Overview

This guide will help you set up the database tables needed for the Coach Dashboard feature.

## 🗄️ Database Migrations Required

You need to run **3 SQL migration files** in your Supabase SQL Editor:

### 1. Add Student Code to Users Table
**File:** `add_student_code_migration.sql`

**What it does:**
- Adds a `student_code` column to the `users` table
- Creates a unique index for fast lookups
- Allows students to be added by coaches using a 4-digit code

**Run this first!**

### 2. Create Coach-Students Relationship Table
**File:** `create_coach_students_table_migration.sql`

**What it does:**
- Creates the `coach_students` table to link coaches with their students
- Ensures each student can only be added once per coach
- Includes indexes for performance

**Run this second!**

### 3. Create Coach Assessments Table
**File:** `create_coach_assessments_table_migration.sql`

**What it does:**
- Creates the `coach_assessments` table to store skill assessments
- Stores detailed skill breakdowns as JSONB
- Includes fields for AI feedback and notes

**Run this third!**

---

## 🚀 How to Run the Migrations

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New query**
4. Copy and paste the contents of each migration file (in order)
5. Click **Run** for each migration
6. Verify the tables were created successfully

### Option 2: Supabase CLI

```bash
# If you're using Supabase CLI
supabase db push

# Or run migrations individually
psql $DATABASE_URL < add_student_code_migration.sql
psql $DATABASE_URL < create_coach_students_table_migration.sql
psql $DATABASE_URL < create_coach_assessments_table_migration.sql
```

---

## ✅ Verification

After running the migrations, verify everything is set up correctly:

```sql
-- Check if student_code column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'student_code';

-- Check if coach_students table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'coach_students';

-- Check if coach_assessments table exists
SELECT table_name FROM information_schema.tables 
WHERE table_name = 'coach_assessments';
```

All three queries should return results.

---

## 🧪 Testing the Coach Dashboard

### Step 1: Make Your User a Coach

First, you need to create a coach profile for your test user:

```sql
-- Insert a coach record linked to your user
INSERT INTO coaches (user_id, name, bio, is_active, is_verified)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with your actual user ID
  'Test Coach',
  'Test coach for development',
  true,
  true
)
RETURNING id, user_id, name;
```

### Step 2: Test the Features

1. **Open the app** - you should now see a "Dashboard" tab instead of "Coach"
2. **Check Profile Screen** - you should see your student code below your email
3. **Add a Student** - use the "+" button in Coach Dashboard to add a student by their code
4. **Start Assessment** - select a student and start a new assessment
5. **Rate Skills** - go through the assessment flow and rate different skills
6. **View Summary** - see the evaluation summary with charts

---

## 🔧 Troubleshooting

### Issue: "Dashboard tab not showing"

**Solution:** 
- Verify your user has a coach record: 
```sql
SELECT * FROM coaches WHERE user_id = 'YOUR_USER_ID';
```
- Make sure `is_active = true`

### Issue: "Can't add student by code"

**Solution:**
- Verify the student code exists:
```sql
SELECT id, name, student_code FROM users WHERE student_code = '1234';
```
- Check if the relationship already exists:
```sql
SELECT * FROM coach_students 
WHERE coach_id = 'YOUR_COACH_ID' AND student_id = 'STUDENT_ID';
```

### Issue: "Student code not showing in profile"

**Solution:**
- The code is auto-generated on first load
- Refresh the Profile screen or restart the app
- Check the database:
```sql
SELECT id, name, email, student_code FROM users WHERE id = 'YOUR_USER_ID';
```

---

## 📊 Database Schema Diagram

```
users
├── id (UUID)
├── email
├── name
└── student_code (NEW!) ←─┐
                           │
coaches                    │
├── id (UUID)              │
├── user_id                │
└── name                   │
                           │
coach_students             │
├── id (UUID)              │
├── coach_id ──→ coaches   │
└── student_id ──→ users ──┘
                           
coach_assessments
├── id (UUID)
├── coach_id ──→ coaches
├── student_id ──→ users
├── total_score
├── skills_data (JSONB)
└── notes
```

---

## 🎯 What's Next

After running the migrations, you can:

1. ✅ Test the coach dashboard with real data
2. ✅ Create assessments and view summaries
3. ✅ Add students using their unique codes
4. 🔄 Implement program generation from assessments (TODO)
5. 🔄 Add assessment history and progress tracking (TODO)
6. 🔄 Enable sharing assessments with students (TODO)

---

## 📝 Notes

- Student codes are auto-generated (4 digits)
- Coaches can only add students who have logged in at least once
- Assessment data is stored as JSONB for flexibility
- All tables include `created_at` and `updated_at` timestamps
- Foreign keys have `ON DELETE CASCADE` for data integrity

---

Need help? Check the implementation in:
- `src/screens/coach/` - All coach screens
- `src/lib/supabase.js` - Coach functions
- `src/navigation/CoachNavigator.js` - Navigation setup

