-- Test script to verify storage setup for avatars
-- Run this in Supabase SQL Editor to check if everything is configured correctly

-- 1. Check if avatars bucket exists and is public
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE name = 'avatars';

-- Expected result: Should show one row with public = true

-- 2. Check existing policies for avatars bucket
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%avatar%';

-- Expected result: Should show 4 policies for avatars

-- 3. Test if current user can access the bucket (if logged in)
-- This will show your current user ID
SELECT auth.uid() as current_user_id;

-- 4. Check if storage.objects table has RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE schemaname = 'storage' 
AND tablename = 'objects';

-- Expected result: rowsecurity should be true
