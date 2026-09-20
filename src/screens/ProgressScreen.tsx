import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { EXERCISES } from '@/lib/exercises';
import ProgressChart from '@/components/ProgressChart';
import type { WorkoutSet } from '@/lib/types';
import { BarChart3, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProgressScreen() {
  const { user, guest } = useAuthStore();
  const navigate = useNavigate();
  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<'reps' | 'good_reps'>('reps');

  useEffect(() => {
    if (guest || !user) { setLoading(false); return; }
    (async () => {
      const { data } = await supabase.from('workout_sets').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
      setSets((data as WorkoutSet[]) ?? []);
      setLoading(false);
    })();
  }, [user, guest]);

  if (guest || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center animate-fade-in">
        <Lock className="w-8 h-8 text-blue mb-3" />
        <h2 className="font-display font-bold text-lg tracking-widest text-ink">SIGN IN TO TRACK</h2>
        <p className="text-xs text-dim mt-1 max-w-xs">Guest sessions are not saved</p>
        <button onClick={() => navigate('/')} className="btn-primary mt-4 text-xs px-6 py-2.5">Sign in</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-6 h-6 border-2 border-blue/30 border-t-blue rounded-full animate-spin" />
      </div>
    );
  }

  const totalReps = sets.reduce((s, x) => s + x.reps, 0);
  const totalGood = sets.reduce((s, x) => s + (x.good_reps ?? 0), 0);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center">
        <h1 className="font-display font-extrabold text-xl tracking-[0.25em] text-ink">PROGRESS</h1>
      </div>

      {sets.length === 0 ? (
        <div className="card p-8 text-center">
          <BarChart3 className="w-8 h-8 text-dim/20 mx-auto mb-2" />
          <p className="text-xs text-dim">Complete a workout to see charts</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <div className="card p-3 text-center">
              <p className="font-display font-bold text-xl text-orange tabular-nums">{totalReps}</p>
              <p className="text-[10px] text-dim uppercase tracking-wider">Total reps</p>
            </div>
            <div className="card p-3 text-center">
              <p className="font-display font-bold text-xl text-green tabular-nums">{totalGood}</p>
              <p className="text-[10px] text-dim uppercase tracking-wider">Good reps</p>
            </div>
          </div>

          <div className="flex gap-1 p-1 bg-surface-2 rounded-lg">
            {(['reps', 'good_reps'] as const).map((m) => (
              <button key={m} onClick={() => setMetric(m)}
                className={`flex-1 py-1.5 rounded-md text-[10px] font-display font-semibold uppercase tracking-widest transition-all ${
                  metric === m ? 'bg-blue text-white shadow-sm' : 'text-dim'
                }`}>
                {m === 'reps' ? 'Reps' : 'Good form'}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {EXERCISES.map((ex) => (
              <ProgressChart key={ex.id} sets={sets} exerciseId={ex.id} metric={metric} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
