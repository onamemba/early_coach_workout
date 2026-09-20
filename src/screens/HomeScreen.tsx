import { REGION_ORDER, REGION_LABELS, exercisesByRegion } from '@/lib/exercises';
import ExerciseCard from '@/components/ExerciseCard';
import { Dumbbell } from 'lucide-react';

export default function HomeScreen() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center py-4">
        <Dumbbell className="w-6 h-6 text-blue mx-auto mb-2" />
        <h1 className="font-display font-extrabold text-2xl tracking-[0.3em] text-ink">PICK A MOVE</h1>
        <p className="text-xs text-dim mt-1">Camera counts your reps</p>
      </div>

      {REGION_ORDER.map((region) => (
        <div key={region}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-4 rounded-full bg-blue" />
            <h2 className="font-display font-bold text-xs tracking-[0.25em] text-dim">
              {REGION_LABELS[region]}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {exercisesByRegion(region).map((ex) => (
              <ExerciseCard key={ex.id} exercise={ex} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
