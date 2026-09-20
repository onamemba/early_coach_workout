import type { Exercise } from './types';

export const EXERCISES: Exercise[] = [
  {
    id: 'pushup',
    name: 'Push-up',
    region: 'upper',
    orientation: 'side',
    primaryMuscle: 'Chest',
    dir: 'flex',
    down_deg: 120,
    up_deg: 158,
    countAngle: { type: 'avg', points: [[11, 13, 15], [12, 14, 16]] },
    startPose: [
      { type: 'torsoLean', op: '>', value: 55 },
      { type: 'angle', points: [11, 13, 15], op: '>', value: 140 },
    ],
    goodRep: { field: 'deep', op: '<=', value: 95 },
    requiredGroups: [[11, 13, 15, 23], [12, 14, 16, 24]],
    cue: 'Turn side-on · plank position · arms straight',
    steps: [
      { text: 'Turn side-on', type: 'setup', condition: { type: 'torsoLean', op: '>', value: 40 } },
      { text: 'Get in a plank', type: 'setup', condition: { type: 'angle', points: [11, 13, 15], op: '>', value: 140 } },
      { text: 'Lower to 90\u00B0', type: 'move' },
      { text: 'Push back up', type: 'move' },
    ],
    muscleRegion: [11, 12, 24, 23],
  },
  {
    id: 'armraise',
    name: 'Arm Raises',
    region: 'upper',
    orientation: 'front',
    primaryMuscle: 'Shoulders',
    dir: 'extend',
    down_deg: 35,
    up_deg: 80,
    countAngle: { type: 'avg', points: [[13, 11, 23], [14, 12, 24]] },
    startPose: [
      { type: 'torsoLean', op: '<', value: 20 },
      { type: 'angle', points: [13, 11, 23], op: '<', value: 35 },
    ],
    goodRep: { field: 'peak', op: '>=', value: 80 },
    requiredGroups: [[11, 12, 13, 14, 23, 24]],
    cue: 'Face the camera · stand tall · arms at sides',
    steps: [
      { text: 'Face the camera', type: 'setup', condition: { type: 'torsoLean', op: '<', value: 30 } },
      { text: 'Arms at your sides', type: 'setup', condition: { type: 'angle', points: [13, 11, 23], op: '<', value: 35 } },
      { text: 'Raise to shoulder height', type: 'move' },
      { text: 'Lower back down', type: 'move' },
    ],
    muscleRegion: [11, 12, 13, 14],
  },
  {
    id: 'situp',
    name: 'Sit-up',
    region: 'core',
    orientation: 'side',
    primaryMuscle: 'Abs',
    dir: 'flex',
    down_deg: 90,
    up_deg: 130,
    countAngle: { type: 'avg', points: [[11, 23, 25], [12, 24, 26]] },
    startPose: [
      { type: 'torsoLean', op: '>', value: 60 },
    ],
    goodRep: { field: 'deep', op: '<=', value: 95 },
    requiredGroups: [[11, 23, 25], [12, 24, 26]],
    cue: 'Turn side-on · lie back · knees bent',
    steps: [
      { text: 'Turn side-on', type: 'setup', condition: { type: 'torsoLean', op: '>', value: 40 } },
      { text: 'Lie back, knees bent', type: 'setup', condition: { type: 'torsoLean', op: '>', value: 60 } },
      { text: 'Curl up', type: 'move' },
      { text: 'Lower back down', type: 'move' },
    ],
    muscleRegion: [11, 12, 24, 23],
  },
  {
    id: 'lyinglegraise',
    name: 'Lying Leg Raise',
    region: 'core',
    orientation: 'side',
    primaryMuscle: 'Lower Abs',
    dir: 'flex',
    down_deg: 100,
    up_deg: 160,
    countAngle: { type: 'avg', points: [[11, 23, 27], [12, 24, 28]] },
    startPose: [
      { type: 'torsoLean', op: '>', value: 60 },
      { type: 'angle', points: [11, 23, 27], op: '>', value: 150 },
    ],
    goodRep: { field: 'deep', op: '<=', value: 105 },
    requiredGroups: [[11, 23, 27], [12, 24, 28]],
    cue: 'Turn side-on · lie flat on back · legs straight',
    steps: [
      { text: 'Turn side-on', type: 'setup', condition: { type: 'torsoLean', op: '>', value: 40 } },
      { text: 'Lie flat on back', type: 'setup', condition: { type: 'angle', points: [11, 23, 27], op: '>', value: 150 } },
      { text: 'Raise legs up', type: 'move' },
      { text: 'Lower legs down', type: 'move' },
    ],
    muscleRegion: [23, 24, 27, 28],
  },
  {
    id: 'squat',
    name: 'Squat',
    region: 'lower',
    orientation: 'any',
    primaryMuscle: 'Quads',
    dir: 'flex',
    down_deg: 120,
    up_deg: 160,
    countAngle: { type: 'avg', points: [[23, 25, 27], [24, 26, 28]] },
    startPose: [
      { type: 'torsoLean', op: '<', value: 25 },
      { type: 'angle', points: [23, 25, 27], op: '>', value: 150 },
    ],
    goodRep: { field: 'deep', op: '<=', value: 100 },
    requiredGroups: [[23, 25, 27], [24, 26, 28]],
    cue: 'Stand tall · feet shoulder-width',
    steps: [
      { text: 'Stand tall', type: 'setup', condition: { type: 'torsoLean', op: '<', value: 25 } },
      { text: 'Feet shoulder-width', type: 'setup', condition: { type: 'angle', points: [23, 25, 27], op: '>', value: 150 } },
      { text: 'Squat down', type: 'move' },
      { text: 'Stand back up', type: 'move' },
    ],
    muscleRegion: [23, 25, 27, 28, 26, 24],
  },
  {
    id: 'rdl',
    name: 'RDL',
    region: 'lower',
    orientation: 'side',
    primaryMuscle: 'Hamstrings',
    dir: 'flex',
    down_deg: 110,
    up_deg: 160,
    countAngle: { type: 'avg', points: [[11, 23, 25], [12, 24, 26]] },
    startPose: [
      { type: 'torsoLean', op: '<', value: 20 },
      { type: 'angle', points: [11, 23, 25], op: '>', value: 150 },
    ],
    goodRep: { field: 'deep', op: '<=', value: 115 },
    requiredGroups: [[11, 23, 25], [12, 24, 26]],
    cue: 'Turn side-on · stand tall · soft knees',
    steps: [
      { text: 'Turn side-on', type: 'setup', condition: { type: 'torsoLean', op: '<', value: 25 } },
      { text: 'Stand tall', type: 'setup', condition: { type: 'angle', points: [11, 23, 25], op: '>', value: 150 } },
      { text: 'Hinge forward', type: 'move' },
      { text: 'Stand back up', type: 'move' },
    ],
    muscleRegion: [23, 24, 25, 26],
  },
];

export const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((e) => [e.id, e]),
);

export const REGION_LABELS: Record<string, string> = {
  upper: 'Upper Body',
  core: 'Core',
  lower: 'Lower Body',
};

export const REGION_ORDER: string[] = ['upper', 'core', 'lower'];

export function exercisesByRegion(region: string): Exercise[] {
  return EXERCISES.filter((e) => e.region === region);
}
