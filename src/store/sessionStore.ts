import { create } from 'zustand';
import type { SetResult } from '../lib/types';

export interface SetRecord {
  exerciseId: string;
  setNumber: number;
  reps: number;
  goodReps: number;
}

interface SessionState {
  exerciseId: string | null;
  totalSets: number;
  currentSet: number;
  sets: SetRecord[];
  active: boolean;
  startExercise: (exerciseId: string, sets?: number) => void;
  recordSet: (result: SetResult) => void;
  endSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  exerciseId: null,
  totalSets: 3,
  currentSet: 0,
  sets: [],
  active: false,

  startExercise: (exerciseId, sets = 3) =>
    set({ exerciseId, totalSets: sets, currentSet: 0, sets: [], active: true }),

  recordSet: (result) =>
    set((state) => {
      const setNumber = state.currentSet + 1;
      const record: SetRecord = {
        exerciseId: state.exerciseId!,
        setNumber,
        reps: result.reps,
        goodReps: result.goodReps,
      };
      return { sets: [...state.sets, record], currentSet: setNumber };
    }),

  endSession: () =>
    set({ exerciseId: null, totalSets: 3, currentSet: 0, sets: [], active: false }),
}));
