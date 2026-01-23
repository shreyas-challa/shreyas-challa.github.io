-- Storage Bucket Policies for Blog Image Uploads
-- Run this in your Supabase SQL Editor to allow public uploads and reads

-- Enable RLS on the storage.objects table (if not already enabled)
-- This is usually already enabled by Supabase

-- Policy 1: Allow anyone to upload to post-content-images bucket
CREATE POLICY "Allow public uploads to post-content-images"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'post-content-images');

-- Policy 2: Allow anyone to read from post-content-images bucket
CREATE POLICY "Allow public reads from post-content-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'post-content-images');

-- Policy 3: Allow anyone to upload to post-covers bucket
CREATE POLICY "Allow public uploads to post-covers"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'post-covers');

-- Policy 4: Allow anyone to read from post-covers bucket
CREATE POLICY "Allow public reads from post-covers"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'post-covers');

-- Optional: Allow updates and deletes if needed
-- Uncomment these if you want to allow replacing/deleting images

-- CREATE POLICY "Allow public updates to post-content-images"
-- ON storage.objects
-- FOR UPDATE
-- TO public
-- USING (bucket_id = 'post-content-images')
-- WITH CHECK (bucket_id = 'post-content-images');

-- CREATE POLICY "Allow public deletes from post-content-images"
-- ON storage.objects
-- FOR DELETE
-- TO public
-- USING (bucket_id = 'post-content-images');

-- CREATE POLICY "Allow public updates to post-covers"
-- ON storage.objects
-- FOR UPDATE
-- TO public
-- USING (bucket_id = 'post-covers')
-- WITH CHECK (bucket_id = 'post-covers');

-- CREATE POLICY "Allow public deletes from post-covers"
-- ON storage.objects
-- FOR DELETE
-- TO public
-- USING (bucket_id = 'post-covers');
