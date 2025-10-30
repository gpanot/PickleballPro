-- Helper queries for managing coach profiles

-- ============================================
-- PUBLISH COACH PROFILE (Enable Dashboard)
-- ============================================
-- Replace 'YOUR_EMAIL' with the coach's email
UPDATE coaches
SET is_accepting_students = true
WHERE user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL')
RETURNING id, name, is_active, is_verified, is_accepting_students;

-- ============================================
-- UNPUBLISH COACH PROFILE (Hide Dashboard)
-- ============================================
-- Replace 'YOUR_EMAIL' with the coach's email
UPDATE coaches
SET is_accepting_students = false
WHERE user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL')
RETURNING id, name, is_active, is_verified, is_accepting_students;

-- ============================================
-- CHECK COACH STATUS
-- ============================================
-- Replace 'YOUR_EMAIL' with the coach's email
SELECT 
  c.id as coach_id,
  c.name as coach_name,
  c.is_active,
  c.is_verified,
  c.is_accepting_students,
  u.email,
  u.name as user_name,
  u.student_code
FROM coaches c
JOIN users u ON u.id = c.user_id
WHERE u.email = 'YOUR_EMAIL';

-- ============================================
-- ACTIVATE/DEACTIVATE COACH
-- ============================================
-- Activate coach (allows them to use coach features)
UPDATE coaches
SET is_active = true
WHERE user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL')
RETURNING id, name, is_active;

-- Deactivate coach (removes access to coach features)
UPDATE coaches
SET is_active = false
WHERE user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL')
RETURNING id, name, is_active;

-- ============================================
-- VERIFY/UNVERIFY COACH
-- ============================================
-- Verify coach (shows verified badge)
UPDATE coaches
SET is_verified = true
WHERE user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL')
RETURNING id, name, is_verified;

-- Unverify coach
UPDATE coaches
SET is_verified = false
WHERE user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL')
RETURNING id, name, is_verified;

-- ============================================
-- LIST ALL COACHES
-- ============================================
SELECT 
  c.id,
  c.name as coach_name,
  c.is_active,
  c.is_verified,
  c.is_accepting_students,
  u.email,
  u.name as user_name,
  (SELECT COUNT(*) FROM coach_students WHERE coach_id = c.id) as student_count
FROM coaches c
JOIN users u ON u.id = c.user_id
ORDER BY c.created_at DESC;

-- ============================================
-- DELETE COACH PROFILE
-- ============================================
-- WARNING: This will delete the coach profile but keep the user account
-- Replace 'YOUR_EMAIL' with the coach's email
DELETE FROM coaches
WHERE user_id = (SELECT id FROM users WHERE email = 'YOUR_EMAIL')
RETURNING id, name;

