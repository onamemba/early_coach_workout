/*
# Storage policies for exercise-videos bucket

1. Security
- Public read on the exercise-videos bucket (anon + authenticated SELECT).
- Authenticated write (INSERT/UPDATE) for admin uploads.
*/

DROP POLICY IF EXISTS "public_read_exercise_videos" ON storage.objects;
CREATE POLICY "public_read_exercise_videos" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'exercise-videos');

DROP POLICY IF EXISTS "auth_write_exercise_videos" ON storage.objects;
CREATE POLICY "auth_write_exercise_videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'exercise-videos');

DROP POLICY IF EXISTS "auth_update_exercise_videos" ON storage.objects;
CREATE POLICY "auth_update_exercise_videos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'exercise-videos') WITH CHECK (bucket_id = 'exercise-videos');

DROP POLICY IF EXISTS "auth_delete_exercise_videos" ON storage.objects;
CREATE POLICY "auth_delete_exercise_videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'exercise-videos');
