import type { Landmark } from '../lib/pose';
import type { Exercise } from '../lib/types';

const CYAN = '#2FA8FF';
const ORANGE = '#FF6A2C';
const MAG = '#8B5CF6';
const GREEN = '#10C46A';
const RED = '#FF3B4E';

const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 23], [12, 24], [23, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [15, 17], [15, 19], [16, 18], [16, 20],
];

const WRISTS = new Set([15, 16, 17, 18, 19, 20]);
const HEAD = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

function activeJoints(ex: Exercise): Set<number> {
  const s = new Set<number>();
  for (const [a, b, c] of ex.countAngle.points) { s.add(a); s.add(b); s.add(c); }
  return s;
}

interface Pt { x: number; y: number }

function mapCoords(
  lm: Landmark, videoEl: HTMLVideoElement, cw: number, ch: number,
): Pt | null {
  if (lm.visibility < 0.3) return null;
  const vw = videoEl.videoWidth || 640;
  const vh = videoEl.videoHeight || 480;
  const va = vw / vh;
  const ca = cw / ch;
  let dw: number, dh: number, ox: number, oy: number;
  if (va > ca) { dh = ch; dw = ch * va; ox = (cw - dw) / 2; oy = 0; }
  else { dw = cw; dh = cw / va; ox = 0; oy = (ch - dh) / 2; }
  return { x: ox + (1 - lm.x) * dw, y: oy + lm.y * dh };
}

export interface OverlayParams {
  landmarks: Landmark[];
  exercise: Exercise;
  videoEl: HTMLVideoElement;
  canvasW: number;
  canvasH: number;
  repPhase: 'up' | 'down';
  currentAngle: number | null;
  flashGood: boolean | null;
  timestamp: number;
}

export function drawBodyOverlay(ctx: CanvasRenderingContext2D, p: OverlayParams) {
  ctx.clearRect(0, 0, p.canvasW, p.canvasH);
  const pts = p.landmarks.map((lm) => mapCoords(lm, p.videoEl, p.canvasW, p.canvasH));
  const active = activeJoints(p.exercise);

  // skeleton connections
  for (const [a, b] of POSE_CONNECTIONS) {
    const pa = pts[a], pb = pts[b];
    if (!pa || !pb) continue;
    if (HEAD.has(a) || HEAD.has(b)) continue;
    const isActive = active.has(a) && active.has(b);
    ctx.save();
    ctx.strokeStyle = isActive ? CYAN : 'rgba(47,168,255,0.35)';
    ctx.lineWidth = isActive ? 3 : 1.5;
    ctx.lineCap = 'round';
    if (isActive) { ctx.shadowBlur = 10; ctx.shadowColor = CYAN; }
    ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
    ctx.restore();
  }

  // explicit angle arms (cyan, thick, glow)
  for (const [ai, bi, ci] of p.exercise.countAngle.points) {
    const pa = pts[ai], pb = pts[bi], pc = pts[ci];
    if (!pa || !pb || !pc) continue;
    for (const [s, e] of [[pa, pb], [pb, pc]] as [Pt, Pt][]) {
      ctx.save();
      ctx.strokeStyle = CYAN; ctx.lineWidth = 2.5; ctx.lineCap = 'round';
      ctx.shadowBlur = 8; ctx.shadowColor = CYAN;
      ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(e.x, e.y); ctx.stroke();
      ctx.restore();
    }
  }

  // joint dots
  for (let i = 0; i < p.landmarks.length; i++) {
    const pt = pts[i];
    if (!pt || HEAD.has(i)) continue;
    let color = 'rgba(47,168,255,0.4)';
    let r = 3; let glow = 0;
    if (active.has(i)) { color = ORANGE; r = 6; glow = 14; }
    if (WRISTS.has(i)) { color = MAG; r = 5; glow = 10; }
    ctx.save();
    if (glow) { ctx.shadowBlur = glow; ctx.shadowColor = color; }
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(pt.x, pt.y, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // degree badge
  if (p.currentAngle !== null && p.exercise.countAngle.points.length > 0) {
    const vi = p.exercise.countAngle.points[0][1];
    const vp = pts[vi];
    if (vp) {
      const label = `${Math.round(p.currentAngle)}\u00B0`;
      ctx.save();
      ctx.font = '700 15px "Barlow Condensed", sans-serif';
      const m = ctx.measureText(label);
      const px = vp.x + 16, py = vp.y - 4;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.roundRect(px - 4, py - 13, m.width + 8, 18, 4); ctx.fill();
      ctx.shadowBlur = 6; ctx.shadowColor = CYAN; ctx.fillStyle = '#FFF';
      ctx.fillText(label, px, py);
      ctx.restore();
    }
  }

  // direction arrow + goal arc
  drawArrow(ctx, pts, p);

  // rep flash
  if (p.flashGood !== null) {
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = p.flashGood ? GREEN : RED;
    ctx.fillRect(0, 0, p.canvasW, p.canvasH);
    ctx.restore();
  }
}

function drawArrow(ctx: CanvasRenderingContext2D, pts: (Pt | null)[], p: OverlayParams) {
  const ex = p.exercise;
  if (ex.countAngle.points.length === 0) return;
  const [ai, bi, ci] = ex.countAngle.points[0];
  const pa = pts[ai], pb = pts[bi], pc = pts[ci];
  if (!pa || !pb || !pc) return;

  const targetAngle = p.repPhase === 'up' ? ex.down_deg : ex.up_deg;
  const atTarget = p.currentAngle !== null && (
    p.repPhase === 'up'
      ? (ex.dir === 'flex' ? p.currentAngle <= targetAngle : p.currentAngle >= targetAngle)
      : (ex.dir === 'flex' ? p.currentAngle >= targetAngle : p.currentAngle <= targetAngle)
  );

  const arm1 = { x: pa.x - pb.x, y: pa.y - pb.y };
  const arm2 = { x: pc.x - pb.x, y: pc.y - pb.y };
  const bisect = { x: arm1.x + arm2.x, y: arm1.y + arm2.y };
  const bLen = Math.hypot(bisect.x, bisect.y) || 1;
  const norm = { x: bisect.x / bLen, y: bisect.y / bLen };

  const goIn = p.repPhase === 'up';
  const dir = goIn ? { x: -norm.x, y: -norm.y } : norm;

  const pulse = 0.6 + 0.4 * Math.sin(p.timestamp / 300);
  const len = 30 * pulse;
  const bx = pb.x + dir.x * 25, by = pb.y + dir.y * 25;
  const tx = bx + dir.x * len, ty = by + dir.y * len;
  const px = -dir.y, py = dir.x;
  const color = atTarget ? GREEN : ORANGE;

  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.shadowBlur = 12; ctx.shadowColor = color;
  ctx.globalAlpha = 0.7 + 0.3 * pulse;
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(tx, ty); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(tx, ty);
  ctx.lineTo(tx - dir.x * 8 + px * 5, ty - dir.y * 8 + py * 5);
  ctx.lineTo(tx - dir.x * 8 - px * 5, ty - dir.y * 8 - py * 5);
  ctx.closePath(); ctx.fill();
  ctx.restore();

  // goal arc
  const a1 = Math.atan2(pa.y - pb.y, pa.x - pb.x);
  const a2 = Math.atan2(pc.y - pb.y, pc.x - pb.x);
  let sA = a2, eA = a1;
  if (sA > eA) { const t = sA; sA = eA; eA = t; }
  if (eA - sA > Math.PI) { sA += Math.PI * 2; const t = sA; sA = eA; eA = t; }
  const frac = (targetAngle * Math.PI / 180) / Math.PI;
  const tA = sA + (eA - sA) * Math.min(1, Math.max(0, frac));

  ctx.save();
  ctx.strokeStyle = atTarget ? GREEN : 'rgba(47,168,255,0.3)';
  ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
  if (atTarget) { ctx.shadowBlur = 8; ctx.shadowColor = GREEN; }
  ctx.beginPath(); ctx.arc(pb.x, pb.y, 35, tA - 0.15, tA + 0.15); ctx.stroke();
  ctx.restore();
}
