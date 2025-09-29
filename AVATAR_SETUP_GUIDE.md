# Avatar Upload Setup Guide

## Issue: Row Level Security Policy Violation

The error `new row violates row-level security policy` means the Supabase storage bucket isn't properly configured.

## Step-by-Step Fix:

### 1. Create Storage Bucket (In Supabase Dashboard)

1. **Go to your Supabase project dashboard**
2. **Click on "Storage" in the sidebar**
3. **Click "New bucket"**
4. **Configure the bucket:**
   - **Name:** `avatars`
   - **Public bucket:** ✅ **Check this box** (very important!)
   - **File size limit:** 50MB (optional)
   - **Allowed MIME types:** Leave empty or add `image/*`
5. **Click "Create bucket"**

### 2. Apply RLS Policies (In SQL Editor)

After creating the bucket, run this SQL in the Supabase SQL Editor:

```sql
-- Policy: Users can upload their own avatars
CREATE POLICY "Users can upload their own avatars" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Anyone can view avatars (public read)
CREATE POLICY "Anyone can view avatars" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'avatars');

-- Policy: Users can update their own avatars
CREATE POLICY "Users can update their own avatars" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own avatars
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3. Add Avatar Column to Users Table

Run this SQL to add the avatar_url column:

```sql
-- Add the avatar_url column to the users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN users.avatar_url IS 'URL to user profile picture stored in Supabase Storage';
```

### 4. Verify Setup

After completing the above steps:

1. **Check Storage Bucket:**
   - Go to Storage > avatars bucket
   - Confirm it's marked as "Public"
   - Check that policies are listed

2. **Test Upload:**
   - Try uploading an avatar again
   - Should work without RLS errors

## Troubleshooting

If you still get RLS errors:

1. **Verify bucket is public** - This is the most common issue
2. **Check user authentication** - Make sure user is logged in
3. **Verify policies** - Run the SQL policies again
4. **Check file path** - Should follow pattern: `avatar_${userId}_${timestamp}.jpg`

## Common Issues

- **Bucket not public:** Avatar uploads will fail
- **Missing policies:** RLS will block uploads
- **Wrong file path format:** Policies expect specific folder structure
- **User not authenticated:** Can't upload without valid auth token
