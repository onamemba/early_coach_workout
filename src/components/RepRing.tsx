interface RepRingProps {
  current: number;
  goal: number;
  size?: number;
}

export default function RepRing({ current, goal, size = 72 }: RepRingProps) {
  const stroke = 4;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(current / goal, 1) : 0;
  const offset = circ * (1 - pct);

  return (
    <div className="chip p-1.5 flex items-center justify-center" style={{ width: size + 12, height: size + 12 }}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="rgba(14,22,38,0.06)" strokeWidth={stroke}
          />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="#FF6A2C" strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-300"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-display font-bold text-2xl text-ink leading-none tabular-nums">
            {current}
          </span>
          <span className="text-[9px] text-dim uppercase tracking-wider">/ {goal}</span>
        </div>
      </div>
    </div>
  );
}
