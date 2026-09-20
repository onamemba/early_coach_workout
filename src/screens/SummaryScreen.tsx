import { useParams, useNavigate } from 'react-router-dom';
import { EXERCISE_MAP } from '@/lib/exercises';
import { useSessionStore } from '@/store/sessionStore';
import { Trophy, ArrowRight, Check, X } from 'lucide-react';

export default function SummaryScreen() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const { sets, endSession } = useSessionStore();

  const exercise = exerciseId ? EXERCISE_MAP[exerciseId] : null;
  if (!exercise) return <div className="text-center py-20 text-dim">Not found.</div>;

  const totalReps = sets.reduce((s, x) => s + x.reps, 0);
  const totalGood = sets.reduce((s, x) => s + x.goodReps, 0);
  const pct = totalReps > 0 ? Math.round((totalGood / totalReps) * 100) : 0;

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-green/10 flex items-center justify-center mb-3 glow-green">
        <Trophy className="w-7 h-7 text-green" />
      </div>
      <h1 className="font-display font-extrabold text-2xl tracking-widest text-ink">DONE</h1>
      <p className="text-xs text-dim mt-1">{exercise.name} · {sets.length} sets</p>

      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-6">
        <div className="card p-4 text-center">
          <p className="font-display font-bold text-3xl text-orange tabular-nums">{totalReps}</p>
          <p className="text-[10px] text-dim uppercase tracking-wider mt-0.5">Total reps</p>
        </div>
        <div className="card p-4 text-center">
          <p className={`font-display font-bold text-3xl tabular-nums ${pct >= 70 ? 'text-green' : 'text-red'}`}>{pct}%</p>
          <p className="text-[10px] text-dim uppercase tracking-wider mt-0.5">Good form</p>
        </div>
      </div>

      <div className="w-full max-w-xs mt-4 space-y-1.5">
        {sets.map((s, i) => (
          <div key={i} className="card px-3 py-2.5 flex items-center justify-between">
            <span className="text-xs text-dim">Set {s.setNumber}</span>
            <div className="flex items-center gap-3">
              <span className="font-display font-semibold text-sm text-ink">{s.reps} reps</span>
              <div className="flex items-center gap-1">
                {s.goodReps === s.reps
                  ? <Check className="w-3.5 h-3.5 text-green" />
                  : <X className="w-3.5 h-3.5 text-red" />}
                <span className="text-xs text-dim">{s.goodReps}/{s.reps}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mt-6 w-full max-w-xs">
        <button onClick={() => { endSession(); navigate(`/exercise/${exerciseId}`); }} className="btn-ghost flex-1 text-xs py-2.5">Again</button>
        <button onClick={() => { endSession(); navigate('/progress'); }} className="btn-primary flex-1 text-xs py-2.5">
          <span className="flex items-center justify-center gap-1.5">Progress <ArrowRight className="w-3.5 h-3.5" /></span>
        </button>
      </div>
    </div>
  );
}
