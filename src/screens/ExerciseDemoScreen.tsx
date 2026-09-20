import { useParams, useNavigate } from 'react-router-dom';
import { EXERCISE_MAP } from '@/lib/exercises';
import DemoVideo from '@/components/DemoVideo';
import { useSessionStore } from '@/store/sessionStore';
import { ArrowLeft, Play } from 'lucide-react';

export default function ExerciseDemoScreen() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const { startExercise } = useSessionStore();

  if (!exerciseId || !EXERCISE_MAP[exerciseId]) {
    return (
      <div className="text-center py-20">
        <p className="text-dim">Exercise not found.</p>
        <button onClick={() => navigate('/home')} className="btn-ghost mt-4 text-xs px-4 py-2">Back</button>
      </div>
    );
  }

  const exercise = EXERCISE_MAP[exerciseId];

  const handleStart = () => {
    startExercise(exerciseId, 3);
    navigate(`/workout/${exerciseId}`);
  };

  return (
    <div className="space-y-3 animate-fade-in -mx-4">
      <div className="px-4 flex items-center justify-between">
        <button onClick={() => navigate('/home')}
          className="flex items-center gap-1.5 text-dim hover:text-ink text-xs transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </div>

      <div className="px-4">
        <h1 className="font-display font-extrabold text-2xl tracking-[0.2em] text-ink">{exercise.name}</h1>
      </div>

      <div className="px-2">
        <DemoVideo exercise={exercise} />
      </div>

      <div className="px-4 pt-1">
        <button onClick={handleStart} className="btn-primary w-full text-base py-4">
          <span className="flex items-center justify-center gap-2">
            <Play className="w-5 h-5" /> START WORKOUT
          </span>
        </button>

        <div className="mt-3 card p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue/10 flex items-center justify-center shrink-0">
            <span className="text-blue text-xs font-display font-bold">
              {exercise.orientation === 'side' ? 'S' : 'F'}
            </span>
          </div>
          <p className="text-xs text-dim leading-relaxed">{exercise.cue}</p>
        </div>
      </div>
    </div>
  );
}
