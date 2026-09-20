import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EXERCISE_MAP } from '@/lib/exercises';
import { useSessionStore } from '@/store/sessionStore';
import { ArrowRight, Coffee } from 'lucide-react';

const REST_SECONDS = 30;

export default function RestScreen() {
  const { exerciseId, setNumber: setNumParam } = useParams<{ exerciseId: string; setNumber: string }>();
  const navigate = useNavigate();
  const { sets } = useSessionStore();
  const [countdown, setCountdown] = useState(REST_SECONDS);

  const exercise = exerciseId ? EXERCISE_MAP[exerciseId] : null;
  const completedSet = parseInt(setNumParam ?? '0', 10);
  const lastSet = sets[sets.length - 1];

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); navigate(`/workout/${exerciseId}`); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate, exerciseId]);

  if (!exercise) return <div className="text-center py-20 text-dim">Exercise not found.</div>;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-fade-in">
      <Coffee className="w-8 h-8 text-orange mb-3" />
      <h1 className="font-display font-extrabold text-2xl tracking-widest text-ink">REST</h1>
      <p className="text-xs text-dim mt-1">
        Set {completedSet} done{lastSet ? ` · ${lastSet.reps} reps · ${lastSet.goodReps} good` : ''}
      </p>

      <div className="my-6 relative w-32 h-32 flex items-center justify-center">
        <svg width="128" height="128" className="-rotate-90">
          <circle cx="64" cy="64" r="58" fill="none" stroke="rgba(14,22,38,0.06)" strokeWidth="4" />
          <circle cx="64" cy="64" r="58" fill="none" stroke="#FF6A2C" strokeWidth="4" strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 58}
            strokeDashoffset={2 * Math.PI * 58 * (1 - countdown / REST_SECONDS)}
            className="transition-all duration-1000 ease-linear"
            style={{ filter: 'drop-shadow(0 0 6px rgba(255,106,44,0.3))' }} />
        </svg>
        <div className="absolute">
          <span className="font-display font-bold text-4xl text-ink tabular-nums">{countdown}</span>
          <p className="text-[10px] text-dim uppercase tracking-wider">sec</p>
        </div>
      </div>

      <button onClick={() => navigate(`/workout/${exerciseId}`)} className="btn-primary text-sm px-8 py-3">
        <span className="flex items-center gap-2">Skip <ArrowRight className="w-4 h-4" /></span>
      </button>
    </div>
  );
}
