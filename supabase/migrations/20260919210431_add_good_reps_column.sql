/*
# Add good_reps column to workout_sets

1. Modified Tables
- `workout_sets`: added `good_reps` (int, default 0) to track how many reps met the quality threshold per set.

2. Notes
- Existing rows get good_reps = 0 (safe default).
- The app now uses good_reps instead of avg_form for the simplified green-check/red-X feedback model.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'workout_sets' AND column_name = 'good_reps'
  ) THEN
    ALTER TABLE workout_sets ADD COLUMN good_reps int NOT NULL DEFAULT 0;
  END IF;
END $$;
