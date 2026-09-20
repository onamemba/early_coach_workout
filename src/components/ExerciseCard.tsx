import { Link } from 'react-router-dom';
import type { Exercise } from '@/lib/types';
import { ChevronRight } from 'lucide-react';

export default function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <Link
      to={`/exercise/${exercise.id}`}
      className="group card-glow p-4 relative overflow-hidden transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-lg text-ink leading-tight tracking-wider">
            {exercise.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-xs text-orange font-semibold uppercase tracking-wider">
              {exercise.primaryMuscle}
            </span>
            <span className="w-1 h-1 rounded-full bg-surface-4" />
            <span className="text-xs text-dim uppercase tracking-wider">
              {exercise.orientation}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-blue text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}
