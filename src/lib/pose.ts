import type { Exercise, PoseCondition, GoodRepCheck } from './types';

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export function angleAt(a: Landmark, b: Landmark, c: Landmark): number {
  const bax = a.x - b.x, bay = a.y - b.y;
  const bcx = c.x - b.x, bcy = c.y - b.y;
  const dot = bax * bcx + bay * bcy;
  const magBA = Math.hypot(bax, bay);
  const magBC = Math.hypot(bcx, bcy);
  if (magBA === 0 || magBC === 0) return 0;
  return (Math.acos(Math.max(-1, Math.min(1, dot / (magBA * magBC)))) * 180) / Math.PI;
}

function sideAngle(lm: Landmark[], a: number, b: number, c: number): number | null {
  const la = lm[a], lb = lm[b], lc = lm[c];
  if (!la || !lb || !lc) return null;
  if (la.visibility <= 0.5 || lb.visibility <= 0.5 || lc.visibility <= 0.5) return null;
  return angleAt(la, lb, lc);
}

export function pairAngle(lm: Landmark[], points: [number, number, number][]): number | null {
  const sides: number[] = [];
  for (const [a, b, c] of points) {
    const v = sideAngle(lm, a, b, c);
    if (v !== null) sides.push(v);
  }
  if (sides.length === 0) return null;
  return sides.reduce((s, v) => s + v, 0) / sides.length;
}

export function minPair(lm: Landmark[], points: [number, number, number][]): number | null {
  const sides: number[] = [];
  for (const [a, b, c] of points) {
    const v = sideAngle(lm, a, b, c);
    if (v !== null) sides.push(v);
  }
  if (sides.length === 0) return null;
  return Math.min(...sides);
}

export function torsoLean(lm: Landmark[]): number | null {
  const ls = lm[11], rs = lm[12], lh = lm[23], rh = lm[24];
  if (!ls || !rs || !lh || !rh) return null;
  if (ls.visibility <= 0.5 || rs.visibility <= 0.5 || lh.visibility <= 0.5 || rh.visibility <= 0.5) return null;
  const shoulderMid = { x: (ls.x + rs.x) / 2, y: (ls.y + rs.y) / 2 };
  const hipMid = { x: (lh.x + rh.x) / 2, y: (lh.y + rh.y) / 2 };
  const dx = hipMid.x - shoulderMid.x;
  const dy = hipMid.y - shoulderMid.y;
  return (Math.atan2(Math.abs(dx), Math.abs(dy)) * 180) / Math.PI;
}

export function computeMetric(lm: Landmark[], ex: Exercise): number | null {
  if (ex.countAngle.type === 'min') return minPair(lm, ex.countAngle.points);
  return pairAngle(lm, ex.countAngle.points);
}

export function signalStrength(lm: Landmark[], ex: Exercise): number {
  const joints = new Set<number>();
  for (const [a, b, c] of ex.countAngle.points) { joints.add(a); joints.add(b); joints.add(c); }
  let sum = 0, n = 0;
  for (const i of joints) { if (lm[i]) { sum += lm[i].visibility; n++; } }
  return n === 0 ? 0 : sum / n;
}

function detectOrientation(lm: Landmark[]): 'front' | 'side' | 'unknown' {
  const ls = lm[11], rs = lm[12];
  if (!ls || !rs || ls.visibility < 0.3 || rs.visibility < 0.3) return 'unknown';
  const w = Math.abs(ls.x - rs.x);
  if (w > 0.1) return 'front';
  if (w < 0.06) return 'side';
  const ratio = Math.min(ls.visibility, rs.visibility) / Math.max(ls.visibility, rs.visibility);
  return ratio < 0.6 ? 'side' : 'front';
}

function checkRequiredLandmarks(lm: Landmark[], groups: number[][]): boolean {
  return groups.some((group) => group.every((i) => lm[i] && lm[i].visibility > 0.4));
}

export function evalCondition(lm: Landmark[], cond: PoseCondition): boolean {
  if (cond.type === 'torsoLean') {
    const lean = torsoLean(lm);
    if (lean === null) return false;
    return compare(lean, cond.op, cond.value);
  }
  if (cond.type === 'angle' && cond.points) {
    const [a, b, c] = cond.points;
    const v = sideAngle(lm, a, b, c);
    if (v === null) {
      const mirror: [number, number, number] = [a % 2 === 1 ? a + 1 : a - 1, b % 2 === 1 ? b + 1 : b - 1, c % 2 === 1 ? c + 1 : c - 1];
      const vm = sideAngle(lm, mirror[0], mirror[1], mirror[2]);
      if (vm === null) return false;
      return compare(vm, cond.op, cond.value);
    }
    return compare(v, cond.op, cond.value);
  }
  return false;
}

function compare(actual: number, op: string, target: number): boolean {
  switch (op) {
    case '<': return actual < target;
    case '>': return actual > target;
    case '<=': return actual <= target;
    case '>=': return actual >= target;
    default: return false;
  }
}

export type GatePhase = 'positioning' | 'counting' | 'paused';

export interface GateState {
  phase: GatePhase;
  positionedSince: number | null;
  outOfPositionSince: number | null;
  orientationOk: boolean;
  landmarksOk: boolean;
  poseOk: boolean;
}

export function createGateState(): GateState {
  return { phase: 'positioning', positionedSince: null, outOfPositionSince: null, orientationOk: false, landmarksOk: false, poseOk: false };
}

const POSITION_HOLD_MS = 1000;
const BREAK_TIMEOUT_MS = 1500;

export function updateGate(state: GateState, lm: Landmark[], ex: Exercise, now: number): GateState {
  const orientationOk = ex.orientation === 'any' || detectOrientation(lm) === ex.orientation || detectOrientation(lm) === 'unknown';
  const landmarksOk = checkRequiredLandmarks(lm, ex.requiredGroups);
  const poseOk = landmarksOk && ex.startPose.every((c) => evalCondition(lm, c));
  const allOk = orientationOk && landmarksOk && poseOk;

  const next = { ...state, orientationOk, landmarksOk, poseOk };

  if (next.phase === 'positioning') {
    if (allOk) {
      if (next.positionedSince === null) next.positionedSince = now;
      if (now - next.positionedSince >= POSITION_HOLD_MS) {
        next.phase = 'counting';
        next.positionedSince = null;
        next.outOfPositionSince = null;
      }
    } else {
      next.positionedSince = null;
    }
  } else if (next.phase === 'counting') {
    if (!landmarksOk) {
      if (next.outOfPositionSince === null) next.outOfPositionSince = now;
      if (now - next.outOfPositionSince >= BREAK_TIMEOUT_MS) {
        next.phase = 'paused';
        next.outOfPositionSince = null;
      }
    } else {
      next.outOfPositionSince = null;
    }
  } else if (next.phase === 'paused') {
    if (allOk) {
      if (next.positionedSince === null) next.positionedSince = now;
      if (now - next.positionedSince >= POSITION_HOLD_MS) {
        next.phase = 'counting';
        next.positionedSince = null;
      }
    } else {
      next.positionedSince = null;
    }
  }

  return next;
}

export interface RepState {
  phase: 'up' | 'down';
  reps: number;
  goodReps: number;
  bestDepth: number | null;
  peakAngle: number | null;
  lastRepGood: boolean | null;
  phaseStartTime: number | null;
  lastDownMs: number | null;
  lastUpMs: number | null;
  firstRepTime: number | null;
}

export function createRepState(): RepState {
  return {
    phase: 'up', reps: 0, goodReps: 0,
    bestDepth: null, peakAngle: null, lastRepGood: null,
    phaseStartTime: null, lastDownMs: null, lastUpMs: null, firstRepTime: null,
  };
}

function evalGoodRep(check: GoodRepCheck, deep: number | null, peak: number | null): boolean {
  const val = check.field === 'deep' ? deep : peak;
  if (val === null) return false;
  return compare(val, check.op, check.value);
}

export function updateRepState(state: RepState, angle: number | null, ex: Exercise, now: number): RepState {
  if (angle === null) return state;
  const isContracted = ex.dir === 'flex' ? angle <= ex.down_deg : angle >= ex.up_deg;
  const isExtended = ex.dir === 'flex' ? angle >= ex.up_deg : angle <= ex.down_deg;

  let { phase, reps, goodReps, bestDepth, peakAngle, phaseStartTime, lastDownMs, lastUpMs, firstRepTime } = state;

  if (bestDepth === null) bestDepth = angle;
  if (ex.dir === 'flex') bestDepth = Math.min(bestDepth, angle);
  else bestDepth = Math.max(bestDepth, angle);
  peakAngle = peakAngle === null ? angle : ex.dir === 'flex' ? Math.max(peakAngle, angle) : Math.min(peakAngle, angle);

  if (phaseStartTime === null) phaseStartTime = now;

  if (phase === 'up' && isContracted) {
    const elapsed = now - phaseStartTime;
    lastDownMs = elapsed;
    phaseStartTime = now;
    phase = 'down';
  } else if (phase === 'down' && isExtended) {
    const elapsed = now - phaseStartTime;
    lastUpMs = elapsed;
    phaseStartTime = now;
    reps += 1;
    if (firstRepTime === null) firstRepTime = now;
    const good = evalGoodRep(ex.goodRep, bestDepth, peakAngle);
    if (good) goodReps += 1;
    return {
      phase: 'up', reps, goodReps, bestDepth: null, peakAngle: null,
      lastRepGood: good, phaseStartTime, lastDownMs, lastUpMs, firstRepTime,
    };
  }

  return { ...state, phase, bestDepth, peakAngle, phaseStartTime, lastDownMs, lastUpMs, firstRepTime };
}

export function gateProgress(state: GateState, now: number): number {
  if (state.positionedSince === null) return 0;
  return Math.min((now - state.positionedSince) / POSITION_HOLD_MS, 1);
}
