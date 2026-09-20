import { Timer } from 'lucide-react';

interface TimerDisplayProps {
  elapsedMs: number;
  lastDownMs: number | null;
  lastUpMs: number | null;
}

function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function formatTempo(ms: number | null): string {
  if (ms === null) return '-.-';
  return (ms / 1000).toFixed(1);
}

export default function TimerDisplay({ elapsedMs, lastDownMs, lastUpMs }: TimerDisplayProps) {
  return (
    <div className="chip px-3 py-1.5 flex items-center gap-2">
      <Timer className="w-3.5 h-3.5 text-blue" />
      <span className="font-display font-bold text-sm text-ink tabular-nums">
        {formatTime(elapsedMs)}
      </span>
      {(lastDownMs !== null || lastUpMs !== null) && (
        <>
          <span className="w-px h-3 bg-surface-3" />
          <span className="text-[10px] text-dim tabular-nums">
            {formatTempo(lastDownMs)}s &darr; {formatTempo(lastUpMs)}s &uarr;
          </span>
        </>
      )}
    </div>
  );
}
