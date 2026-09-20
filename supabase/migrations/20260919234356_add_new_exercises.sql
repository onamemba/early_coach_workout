/*
# Add new exercises: Lying Leg Raise and RDL

1. Changes
   - Insert 'lyinglegraise' (Lying Leg Raise) into exercises table
   - Insert 'rdl' (Romanian Deadlift) into exercises table
   - These replace the previous 'kneeraise' and 'glutebridge' exercises in the app

2. Notes
   - Uses ON CONFLICT DO NOTHING to be idempotent
   - All required columns populated
*/

INSERT INTO exercises (id, name, region, view, dir, down_deg, up_deg, cue, tip, metric_json, form_json, muscles_json)
VALUES
  ('lyinglegraise', 'Lying Leg Raise', 'core', 'side', 'flex', 100, 160,
   'Turn side-on · lie flat on back · legs straight',
   'Keep legs straight throughout',
   '{"type":"avg","points":[[11,23,27],[12,24,28]]}'::jsonb,
   '{"field":"deep","op":"<=","value":105}'::jsonb,
   '[{"name":"Lower Abs","pct":70},{"name":"Hip flexors","pct":30}]'::jsonb),
  ('rdl', 'RDL', 'lower', 'side', 'flex', 110, 160,
   'Turn side-on · stand tall · soft knees',
   'Keep back flat as you hinge',
   '{"type":"avg","points":[[11,23,25],[12,24,26]]}'::jsonb,
   '{"field":"deep","op":"<=","value":115}'::jsonb,
   '[{"name":"Hamstrings","pct":55},{"name":"Glutes","pct":35},{"name":"Lower back","pct":10}]'::jsonb)
ON CONFLICT (id) DO NOTHING;
