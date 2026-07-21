-- Create the `offerings` storage bucket for thumbnails
-- Objects follow the path: {offering_id}/thumbnail_{timestamp}.jpg

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'offerings',
  'offerings',
  true,                          -- public bucket (thumbnails are displayed to all users)
  512 * 1024,                    -- 512 KB max upload (our compress targets 200 KB)
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ─── Storage RLS policies ────────────────────────────────────────────────────

-- Anyone can view offering thumbnails (public bucket, but be explicit)
CREATE POLICY "offerings_thumbnails_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'offerings');

-- Authenticated users (coaches) can upload thumbnails
CREATE POLICY "offerings_thumbnails_authenticated_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'offerings');

-- Authenticated users (coaches) can update/replace their thumbnails
CREATE POLICY "offerings_thumbnails_authenticated_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'offerings');

-- Authenticated users (coaches) can delete thumbnails
CREATE POLICY "offerings_thumbnails_authenticated_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'offerings');
