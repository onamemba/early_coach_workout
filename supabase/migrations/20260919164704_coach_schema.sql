/*
# COACH — AI camera personal trainer schema

1. New Tables
- `profiles` — one row per auth user (id = auth.uid, display_name, created_at).
- `exercises` — the six bodyweight exercises (id text PK, name, region, view, dir, down_deg, up_deg, cue, tip, metric_json, form_json, muscles_json). World-readable so guests can browse.
- `exercise_videos` — demo clip metadata per exercise (exercise_id FK, storage_path, poster_path, loop_start_s, loop_end_s). World-readable.
- `workouts` — a session (id uuid PK, user_id FK, started_at, ended_at). Owner-scoped.
- `workout_sets` — individual sets within a workout (id uuid PK, workout_id FK, user_id FK, exercise_id FK, set_number, reps, avg_form, created_at). Owner-scoped.

2. Security (RLS)
- profiles: owner-scoped CRUD (authenticated).
- exercises + exercise_videos: world-readable (anon + authenticated SELECT), no writes from the API (admin writes via service role / SQL). Authenticated insert/update/delete on exercise_videos for admin uploads.
- workouts + workout_sets: owner-scoped CRUD (authenticated), with user_id defaulted to auth.uid().

3. Storage
- Public bucket "exercise-videos" for demo clips (public read, authenticated write).
*/

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- exercises (seeded, world-readable)
CREATE TABLE IF NOT EXISTS exercises (
  id text PRIMARY KEY,
  name text NOT NULL,
  region text NOT NULL,
  view text NOT NULL,
  dir text NOT NULL,
  down_deg int NOT NULL,
  up_deg int NOT NULL,
  cue text NOT NULL,
  tip text NOT NULL,
  metric_json jsonb NOT NULL,
  form_json jsonb NOT NULL,
  muscles_json jsonb NOT NULL
);
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_exercises" ON exercises;
CREATE POLICY "read_exercises" ON exercises FOR SELECT TO anon, authenticated USING (true);

-- exercise_videos (world-readable; authenticated can write for admin uploads)
CREATE TABLE IF NOT EXISTS exercise_videos (
  exercise_id text PRIMARY KEY REFERENCES exercises(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  poster_path text,
  loop_start_s float,
  loop_end_s float
);
ALTER TABLE exercise_videos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read_exercise_videos" ON exercise_videos;
CREATE POLICY "read_exercise_videos" ON exercise_videos FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "write_exercise_videos" ON exercise_videos;
CREATE POLICY "write_exercise_videos" ON exercise_videos FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "update_exercise_videos" ON exercise_videos;
CREATE POLICY "update_exercise_videos" ON exercise_videos FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- workouts (owner-scoped)
CREATE TABLE IF NOT EXISTS workouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz
);
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_workouts" ON workouts;
CREATE POLICY "select_own_workouts" ON workouts FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_workouts" ON workouts;
CREATE POLICY "insert_own_workouts" ON workouts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_workouts" ON workouts;
CREATE POLICY "update_own_workouts" ON workouts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_workouts" ON workouts;
CREATE POLICY "delete_own_workouts" ON workouts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- workout_sets (owner-scoped)
CREATE TABLE IF NOT EXISTS workout_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id uuid NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  exercise_id text NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  set_number int NOT NULL,
  reps int NOT NULL,
  avg_form int NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE workout_sets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_own_workout_sets" ON workout_sets;
CREATE POLICY "select_own_workout_sets" ON workout_sets FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_workout_sets" ON workout_sets;
CREATE POLICY "insert_own_workout_sets" ON workout_sets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_workout_sets" ON workout_sets;
CREATE POLICY "update_own_workout_sets" ON workout_sets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_workout_sets" ON workout_sets;
CREATE POLICY "delete_own_workout_sets" ON workout_sets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Seed the six exercises
INSERT INTO exercises (id, name, region, view, dir, down_deg, up_deg, cue, tip, metric_json, form_json, muscles_json) VALUES
('pushup','Push-up','upper','side','flex',120,158,
 'Lower until your elbows bend to about 90°',
 'Knees down is fine to start. Keep a straight line head-to-hips.',
 '{"type":"avg","points":[[11,13,15],[12,14,16]]}',
 '[{"id":"depth","pass":"deepAngle<=95","ok":"Full range","warn":"Lower your chest further"},{"id":"body","pass":"torsoLean>55","ok":"Body straight","warn":"Keep a plank"}]',
 '[["Chest",60],["Triceps",25],["Shoulders",15]]'),
('armraise','Arm Raises','upper','front','extend',35,80,
 'Raise both arms straight out to shoulder height',
 'No weights. Slow and controlled, dont swing.',
 '{"type":"avg","points":[[13,11,23],[14,12,24]]}',
 '[{"id":"height","pass":"peakAngle>=80","ok":"Up to shoulder height","warn":"Raise a little higher"}]',
 '[["Shoulders",70],["Upper chest",20],["Traps",10]]'),
('situp','Sit-up','core','side','flex',90,130,
 'Curl all the way up until chest meets knees',
 'Turn side-on to the camera. Knees bent, feet flat.',
 '{"type":"avg","points":[[11,23,25],[12,24,26]]}',
 '[{"id":"range","pass":"deepAngle<=95","ok":"Full crunch","warn":"Come up higher"}]',
 '[["Abs",80],["Hip flexors",20]]'),
('kneeraise','Standing Knee Raise','core','front','flex',110,150,
 'Drive one knee up toward your chest, then switch',
 'Alternate legs. Stand tall, dont lean back.',
 '{"type":"min","points":[[11,23,25],[12,24,26]]}',
 '[{"id":"height","pass":"deepAngle<=110","ok":"Knee up high","warn":"Lift the knee higher"}]',
 '[["Lower abs",60],["Hip flexors",40]]'),
('squat','Squat','lower','front','flex',120,160,
 'Sit back until your thighs reach parallel',
 'Feet shoulder-width, weight in heels, chest up.',
 '{"type":"avg","points":[[23,25,27],[24,26,28]]}',
 '[{"id":"depth","pass":"deepAngle<=100","ok":"Good depth","warn":"Go deeper — hips below knees"},{"id":"lean","pass":"torsoLean<45","ok":"Chest up","warn":"Too much forward lean"}]',
 '[["Quads",55],["Glutes",35],["Hamstrings",10]]'),
('glutebridge','Glute Bridge','lower','side','extend',130,160,
 'Squeeze glutes and lift hips to a straight line',
 'Lie on your back side-on to the camera, knees bent.',
 '{"type":"avg","points":[[11,23,25],[12,24,26]]}',
 '[{"id":"lockout","pass":"peakAngle>=160","ok":"Full extension","warn":"Push your hips higher"}]',
 '[["Glutes",65],["Hamstrings",25],["Core",10]]')
ON CONFLICT (id) DO UPDATE SET
  name=EXCLUDED.name, region=EXCLUDED.region, view=EXCLUDED.view, dir=EXCLUDED.dir,
  down_deg=EXCLUDED.down_deg, up_deg=EXCLUDED.up_deg, cue=EXCLUDED.cue, tip=EXCLUDED.tip,
  metric_json=EXCLUDED.metric_json, form_json=EXCLUDED.form_json, muscles_json=EXCLUDED.muscles_json;
