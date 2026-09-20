export type Region = 'upper' | 'core' | 'lower';
export type Orientation = 'front' | 'side' | 'any';
export type Dir = 'flex' | 'extend';

export interface PoseCondition {
  type: 'torsoLean' | 'angle';
  points?: [number, number, number];
  op: '<' | '>' | '<=' | '>=';
  value: number;
}

export interface GoodRepCheck {
  field: 'deep' | 'peak';
  op: '<=' | '>=';
  value: number;
}

export interface CoachingStep {
  text: string;
  type: 'setup' | 'move';
  condition?: PoseCondition;
}

export interface Exercise {
  id: string;
  name: string;
  region: Region;
  orientation: Orientation;
  primaryMuscle: string;
  dir: Dir;
  down_deg: number;
  up_deg: number;
  countAngle: { type: 'avg' | 'min'; points: [number, number, number][] };
  startPose: PoseCondition[];
  goodRep: GoodRepCheck;
  requiredGroups: number[][];
  cue: string;
  steps: CoachingStep[];
  muscleRegion: number[];
}

export interface ExerciseVideo {
  exercise_id: string;
  storage_path: string;
  poster_path: string | null;
  loop_start_s: number | null;
  loop_end_s: number | null;
}

export interface WorkoutSet {
  id: string;
  workout_id: string;
  user_id: string;
  exercise_id: string;
  set_number: number;
  reps: number;
  good_reps: number;
  created_at: string;
}

export interface Workout {
  id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
}

export interface SetResult {
  reps: number;
  goodReps: number;
}
