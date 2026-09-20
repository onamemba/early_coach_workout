import { Check } from 'lucide-react';
import type { CoachingStep } from '../lib/types';

interface StepStripProps {
  steps: CoachingStep[];
  currentStep: number;
  completed: boolean[];
}

export default function StepStrip({ steps, currentStep, completed }: StepStripProps) {
  return (
    <div className="chip px-3 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none">
      {steps.map((step, i) => {
        const done = completed[i];
        const active = i === currentStep && !done;
        return (
          <div
            key={i}
            className={`flex items-center gap-1.5 shrink-0 text-xs font-display font-semibold tracking-wide transition-all duration-200 ${
              done
                ? 'text-green'
                : active
                  ? 'text-orange'
                  : 'text-dim/50'
            }`}
          >
            {done ? (
              <Check className="w-3.5 h-3.5 text-green" strokeWidth={3} />
            ) : (
              <span
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  active
                    ? 'bg-orange text-white'
                    : 'bg-surface-3 text-dim/60'
                }`}
              >
                {i + 1}
              </span>
            )}
            <span className={active ? '' : done ? 'line-through opacity-60' : ''}>
              {step.text}
            </span>
            {i < steps.length - 1 && (
              <span className="text-surface-4 mx-0.5">&middot;</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
