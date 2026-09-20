import { EXERCISE_MAP } from '@/lib/exercises';
import type { WorkoutSet } from '@/lib/types';

interface Props {
  sets: WorkoutSet[];
  exerciseId: string;
  metric: 'reps' | 'good_reps';
}

export default function ProgressChart({ sets, exerciseId, metric }: Props) {
  const ex = EXERCISE_MAP[exerciseId];
  if (!ex) return null;

  const filtered = sets.filter((s) => s.exercise_id === exerciseId);
  if (filtered.length === 0) return null;

  const values = filtered.map((s) => (metric === 'reps' ? s.reps : s.good_reps ?? 0));
  const max = Math.max(...values, 1);
  const w = 280, h = 80, pad = 20;
  const innerW = w - pad * 2;
  const innerH = h - pad;

  const points = values.map((v, i) => {
    const x = pad + (values.length === 1 ? innerW / 2 : (i / (values.length - 1)) * innerW);
    const y = h - pad / 2 - (v / max) * innerH;
    return `${x},${y}`;
  });

  const lineColor = metric === 'reps' ? '#1E6BFF' : '#FF6A2C';

  return (
    <div className="card p-3">
      <p className="font-display font-semibold text-xs text-ink tracking-wider mb-1">{ex.name}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: 80 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={pad} x2={w - pad} y1={h - pad / 2 - f * innerH} y2={h - pad / 2 - f * innerH}
            stroke="rgba(14,22,38,0.06)" strokeWidth="1" />
        ))}
        {points.length > 1 && (
          <polyline fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            points={points.join(' ')} />
        )}
        {points.map((p, i) => {
          const [cx, cy] = p.split(',').map(Number);
          return <circle key={i} cx={cx} cy={cy} r="3" fill={lineColor} />;
        })}
      </svg>
    </div>
  );
}
