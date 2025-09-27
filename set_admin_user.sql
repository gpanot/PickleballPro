-- Set the admin@picklepro.com user as admin
UPDATE users 
SET is_admin = true 
WHERE id = '62983aef-6feb-4a45-a702-4603eb061f1a';

-- Verify the update worked
SELECT id, email, is_admin, created_at 
FROM users 
WHERE id = '62983aef-6feb-4a45-a702-4603eb061f1a';
