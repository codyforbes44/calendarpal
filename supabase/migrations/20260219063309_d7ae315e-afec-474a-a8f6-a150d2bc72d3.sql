
-- Create public og-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'og-images',
  'og-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
);

-- Allow public read access to all files in og-images
CREATE POLICY "Public read access for og-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'og-images');

-- Allow service role to upload/overwrite files
CREATE POLICY "Service role can upload og-images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'og-images');

CREATE POLICY "Service role can update og-images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'og-images');
