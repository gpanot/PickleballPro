-- Setup Supabase Storage bucket for program thumbnails
-- 
-- INSTRUCTIONS:
-- 1. First, create the bucket manually in Supabase Dashboard:
--    - Go to Storage > Create bucket
--    - Name: "program_thumbnails"
--    - Make it Public: Yes
--
-- 2. Then run this script in your Supabase SQL editor for the policies:

-- Set up Row Level Security policies for the program_thumbnails bucket
-- Note: The bucket should be created manually in the Supabase Dashboard first

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can upload their own program thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view program thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own program thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own program thumbnails" ON storage.objects;

-- Policy: Users can upload their own program thumbnails
CREATE POLICY "Users can upload their own program thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'program_thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Anyone can view program thumbnails (public read)
CREATE POLICY "Anyone can view program thumbnails" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'program_thumbnails');

-- Policy: Users can update their own program thumbnails
CREATE POLICY "Users can update their own program thumbnails" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'program_thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own program thumbnails
CREATE POLICY "Users can delete their own program thumbnails" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'program_thumbnails' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Test the setup by checking if policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'objects' 
AND policyname LIKE '%program thumbnails%'
ORDER BY policyname;
