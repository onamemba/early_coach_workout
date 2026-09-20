import { useEffect, useRef } from 'react';

type P = [number, number];

interface Anim {
  joints: P[];
  jointsB: P[];
  bones: [number, number][];
  active: number[];
  wrists: number[];
}

const SIDE_BONES: [number, number][] = [[0,1],[1,2],[2,3],[1,4],[4,5],[5,6]];
const FRONT_BONES: [number, number][] = [
  [0,1],[0,2],[1,2],[1,3],[3,5],[2,4],[4,6],[1,7],[2,8],[7,8],[7,9],[9,11],[8,10],[10,12],
];

const ANIMS: Record<string, Anim> = {
  pushup: {
    joints:  [[.82,.25],[.70,.32],[.76,.50],[.76,.65],[.35,.35],[.18,.52],[.06,.62]],
    jointsB: [[.80,.40],[.70,.46],[.78,.56],[.76,.65],[.35,.42],[.18,.52],[.06,.62]],
    bones: SIDE_BONES, active: [1,2,3], wrists: [3],
  },
  armraise: {
    joints:  [[.50,.08],[.35,.22],[.65,.22],[.32,.36],[.68,.36],[.30,.48],[.70,.48],[.40,.50],[.60,.50],[.40,.70],[.60,.70],[.40,.88],[.60,.88]],
    jointsB: [[.50,.08],[.35,.22],[.65,.22],[.20,.18],[.80,.18],[.12,.20],[.88,.20],[.40,.50],[.60,.50],[.40,.70],[.60,.70],[.40,.88],[.60,.88]],
    bones: FRONT_BONES, active: [1,2,3,4], wrists: [5,6],
  },
  situp: {
    joints:  [[.85,.38],[.72,.42],[.80,.32],[.85,.26],[.42,.52],[.28,.36],[.18,.52]],
    jointsB: [[.58,.22],[.55,.30],[.62,.22],[.65,.16],[.42,.52],[.28,.36],[.18,.52]],
    bones: SIDE_BONES, active: [1,4,5], wrists: [3],
  },
  lyinglegraise: {
    joints:  [[.88,.38],[.75,.42],[.82,.34],[.88,.30],[.42,.46],[.22,.48],[.05,.48]],
    jointsB: [[.88,.38],[.75,.42],[.82,.34],[.88,.30],[.42,.46],[.35,.20],[.28,.08]],
    bones: SIDE_BONES, active: [1,4,6], wrists: [3],
  },
  squat: {
    joints:  [[.50,.08],[.35,.20],[.65,.20],[.28,.32],[.72,.32],[.25,.40],[.75,.40],[.40,.48],[.60,.48],[.38,.65],[.62,.65],[.38,.85],[.62,.85]],
    jointsB: [[.50,.20],[.35,.32],[.65,.32],[.20,.36],[.80,.36],[.15,.40],[.85,.40],[.38,.52],[.62,.52],[.30,.68],[.70,.68],[.38,.85],[.62,.85]],
    bones: FRONT_BONES, active: [7,8,9,10], wrists: [5,6],
  },
  rdl: {
    joints:  [[.50,.08],[.50,.20],[.45,.34],[.42,.44],[.50,.46],[.48,.66],[.48,.88]],
    jointsB: [[.22,.18],[.30,.25],[.26,.38],[.24,.48],[.48,.40],[.48,.64],[.48,.88]],
    bones: SIDE_BONES, active: [1,4,5], wrists: [3],
  },
};

const CYAN = '#2FA8FF';
const ORANGE = '#FF6A2C';
const MAG = '#8B5CF6';

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function ease(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

interface CornerDemoProps {
  exerciseId: string;
}

export default function CornerDemo({ exerciseId }: CornerDemoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const anim = ANIMS[exerciseId];
    if (!anim) return;

    const W = 110, H = 150;
    const dpr = devicePixelRatio;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    const CYCLE_MS = 2400;
    const start = performance.now();

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      const elapsed = performance.now() - start;
      const phase = (elapsed % CYCLE_MS) / CYCLE_MS;
      const t = ease(phase < 0.5 ? phase * 2 : 2 - phase * 2);

      ctx.clearRect(0, 0, W, H);

      const pad = 8;
      const iw = W - pad * 2, ih = H - pad * 2;
      const pts = anim.joints.map((a, i) => {
        const b = anim.jointsB[i];
        return { x: pad + lerp(a[0], b[0], t) * iw, y: pad + lerp(a[1], b[1], t) * ih };
      });

      const activeSet = new Set(anim.active);
      const wristSet = new Set(anim.wrists);

      for (const [a, b] of anim.bones) {
        const pa = pts[a], pb = pts[b];
        const isActive = activeSet.has(a) && activeSet.has(b);
        ctx.save();
        ctx.strokeStyle = isActive ? CYAN : 'rgba(47,168,255,0.4)';
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.lineCap = 'round';
        if (isActive) { ctx.shadowBlur = 6; ctx.shadowColor = CYAN; }
        ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        ctx.restore();
      }

      for (let i = 0; i < pts.length; i++) {
        const p = pts[i];
        let color = 'rgba(47,168,255,0.5)';
        let r = 2;
        if (activeSet.has(i)) { color = ORANGE; r = 3.5; }
        if (wristSet.has(i)) { color = MAG; r = 3; }
        ctx.save();
        if (activeSet.has(i) || wristSet.has(i)) {
          ctx.shadowBlur = 6; ctx.shadowColor = color;
        }
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
    };

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [exerciseId]);

  return (
    <div className="rounded-xl overflow-hidden" style={{
      width: 110, height: 150,
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(8px)',
      boxShadow: '0 2px 12px rgba(47,168,255,0.12), 0 0 20px rgba(47,168,255,0.06)',
    }}>
      <canvas ref={canvasRef} style={{ width: 110, height: 150 }} />
    </div>
  );
}
