import type { GatePhase } from '../lib/pose';
import { Check, X } from 'lucide-react';

interface StatusRingProps {
  phase: GatePhase;
  progress: number;
  size?: number;
}

export default function StatusRing({ phase, progress, size = 52 }: StatusRingProps) {
  const stroke = 3;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;

  const isGreen = phase === 'counting';
  const isRed = phase === 'paused';
  const color = isGreen ? '#10C46A' : isRed ? '#FF3B4E' : '#1E6BFF';
  const fill = phase === 'positioning' || phase === 'paused' ? progress : 1;
  const offset = circ * (1 - fill);

  return (
    <div className="chip p-1 flex items-center justify-center" style={{ width: size + 8, height: size + 8 }}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="rgba(244,247,251,0.5)" stroke="rgba(14,22,38,0.06)" strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-150"
          />
        </svg>
        <div className="absolute flex items-center justify-center">
          {isGreen && <Check className="w-5 h-5" style={{ color }} strokeWidth={3} />}
          {isRed && <X className="w-5 h-5" style={{ color }} strokeWidth={3} />}
          {phase === 'positioning' && progress > 0 && (
            <div className="w-2 h-2 rounded-full animate-pulse-glow" style={{ background: color }} />
          )}
        </div>
      </div>
    </div>
  );
}
