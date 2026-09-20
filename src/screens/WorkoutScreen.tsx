import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EXERCISE_MAP } from '@/lib/exercises';
import { useCamera } from '@/hooks/useCamera';
import { getPoseLandmarker } from '@/lib/poseLandmarker';
import {
  createRepState, updateRepState, computeMetric,
  createGateState, updateGate, gateProgress, evalCondition,
  type Landmark, type RepState, type GateState,
} from '@/lib/pose';
import { drawBodyOverlay } from '@/components/BodyOverlay';
import StepStrip from '@/components/StepStrip';
import TimerDisplay from '@/components/TimerDisplay';
import CornerDemo from '@/components/CornerDemo';
import { useSessionStore } from '@/store/sessionStore';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import type { SetResult } from '@/lib/types';
import { ArrowLeft, Camera, Loader2, AlertTriangle } from 'lucide-react';

const REP_GOAL = 12;

export default function WorkoutScreen() {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const { stream, error, starting, videoRef, start, stop } = useCamera();
  const { user, guest } = useAuthStore();
  const { recordSet, currentSet, totalSets } = useSessionStore();
  const exercise = exerciseId ? EXERCISE_MAP[exerciseId] : null;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const repStateRef = useRef<RepState>(createRepState());
  const gateStateRef = useRef<GateState>(createGateState());
  const rafRef = useRef(0);
  const workoutIdRef = useRef<string | null>(null);
  const setDoneRef = useRef(false);
  const repFlashRef = useRef<{ good: boolean; time: number } | null>(null);

  const [modelLoading, setModelLoading] = useState(false);
  const [modelError, setModelError] = useState<string | null>(null);
  const [reps, setReps] = useState(0);
  const [goodReps, setGoodReps] = useState(0);
  const [gatePhase, setGatePhase] = useState<GateState['phase']>('positioning');
  const [currentAngle, setCurrentAngle] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [repPhase, setRepPhase] = useState<'up' | 'down'>('up');
  const [stepCompleted, setStepCompleted] = useState<boolean[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [lastDownMs, setLastDownMs] = useState<number | null>(null);
  const [lastUpMs, setLastUpMs] = useState<number | null>(null);

  const setNumber = currentSet + 1;

  useEffect(() => {
    if (exercise) {
      setStepCompleted(new Array(exercise.steps.length).fill(false));
      setCurrentStep(0);
    }
  }, [exercise?.id]);

  useEffect(() => {
    if (!exerciseId || guest || !user) return;
    (async () => {
      const { data } = await supabase.from('workouts').insert({ user_id: user.id }).select('id').single();
      if (data) workoutIdRef.current = data.id;
    })();
  }, [exerciseId, user, guest]);

  useEffect(() => {
    if (!stream) return;
    setModelLoading(true);
    getPoseLandmarker()
      .then(() => setModelLoading(false))
      .catch((e) => { setModelError(`Model failed: ${e.message}`); setModelLoading(false); });
  }, [stream]);

  const saveSet = useCallback(async (result: SetResult) => {
    if (guest || !user || !workoutIdRef.current || !exerciseId) return;
    setSaving(true);
    await supabase.from('workout_sets').insert({
      workout_id: workoutIdRef.current, user_id: user.id,
      exercise_id: exerciseId, set_number: setNumber,
      reps: result.reps, good_reps: result.goodReps, avg_form: 0,
    });
    setSaving(false);
  }, [guest, user, exerciseId, setNumber]);

  const finishSet = useCallback(() => {
    if (setDoneRef.current) return;
    setDoneRef.current = true;
    const r = repStateRef.current;
    const result: SetResult = { reps: r.reps, goodReps: r.goodReps };
    recordSet(result);
    saveSet(result);
    stop();
    if (setNumber >= totalSets) navigate(`/summary/${exerciseId}`);
    else navigate(`/rest/${exerciseId}/${setNumber}`);
  }, [recordSet, saveSet, stop, navigate, exerciseId, setNumber, totalSets]);

  useEffect(() => {
    if (!stream || !videoRef.current || !canvasRef.current || !exercise) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lm: Awaited<ReturnType<typeof getPoseLandmarker>> | null = null;
    getPoseLandmarker().then((l) => (lm = l));
    let lastTime = -1;

    const loop = () => {
      rafRef.current = requestAnimationFrame(loop);
      if (!lm || video.readyState < 2) return;
      if (video.currentTime === lastTime) return;
      lastTime = video.currentTime;
      const now = performance.now();

      let landmarks: Landmark[] | null = null;
      try {
        const result = lm.detectForVideo(video, now);
        if (result.landmarks?.[0]) landmarks = result.landmarks[0] as Landmark[];
      } catch { return; }

      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      const dpr = devicePixelRatio;
      if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
        canvas.width = cw * dpr; canvas.height = ch * dpr;
        ctx.scale(dpr, dpr);
      }

      if (!landmarks) { ctx.clearRect(0, 0, cw, ch); return; }

      gateStateRef.current = updateGate(gateStateRef.current, landmarks, exercise, now);
      const gate = gateStateRef.current;
      setGatePhase(gate.phase);

      const angle = computeMetric(landmarks, exercise);
      setCurrentAngle(angle);

      if (gate.phase === 'positioning' || gate.phase === 'paused') {
        const setupSteps = exercise.steps.filter((s) => s.type === 'setup');
        setStepCompleted((prev) => {
          const next = [...prev];
          let newCurrent = 0;
          for (let i = 0; i < setupSteps.length; i++) {
            const stepIdx = exercise.steps.indexOf(setupSteps[i]);
            if (setupSteps[i].condition && evalCondition(landmarks!, setupSteps[i].condition!)) {
              next[stepIdx] = true;
            }
            if (!next[stepIdx]) { newCurrent = stepIdx; break; }
            newCurrent = stepIdx + 1;
          }
          setCurrentStep(Math.min(newCurrent, exercise.steps.length - 1));
          return next;
        });
      }

      if (gate.phase === 'counting') {
        const prevReps = repStateRef.current.reps;
        const prevPhase = repStateRef.current.phase;
        repStateRef.current = updateRepState(repStateRef.current, angle, exercise, now);
        const rs = repStateRef.current;
        setRepPhase(rs.phase);

        if (rs.reps !== prevReps) {
          setReps(rs.reps);
          setGoodReps(rs.goodReps);
          setLastDownMs(rs.lastDownMs);
          setLastUpMs(rs.lastUpMs);
          repFlashRef.current = { good: rs.lastRepGood ?? false, time: now };
        }
        if (rs.firstRepTime !== null) setElapsedMs(now - rs.firstRepTime);

        const moveSteps = exercise.steps.filter((s) => s.type === 'move');
        if (moveSteps.length >= 2) {
          const downIdx = exercise.steps.indexOf(moveSteps[0]);
          const upIdx = exercise.steps.indexOf(moveSteps[1]);
          setStepCompleted((prev) => {
            const next = [...prev];
            exercise.steps.forEach((s, i) => { if (s.type === 'setup') next[i] = true; });
            if (rs.phase === 'down' && prevPhase === 'up') {
              next[downIdx] = true; next[upIdx] = false;
              setCurrentStep(upIdx);
            } else if (rs.reps !== prevReps) {
              next[upIdx] = true;
              setTimeout(() => {
                setStepCompleted((p) => { const n = [...p]; n[downIdx] = false; n[upIdx] = false; return n; });
                setCurrentStep(downIdx);
              }, 400);
            }
            return next;
          });
        }
        if (rs.reps >= REP_GOAL) { finishSet(); return; }
      }

      let flashGood: boolean | null = null;
      if (repFlashRef.current && now - repFlashRef.current.time < 400) {
        flashGood = repFlashRef.current.good;
      } else { repFlashRef.current = null; }

      drawBodyOverlay(ctx, {
        landmarks, exercise, videoEl: video, canvasW: cw, canvasH: ch,
        repPhase: repStateRef.current.phase, currentAngle: angle,
        flashGood, timestamp: now,
      });
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [stream, exercise, finishSet, videoRef]);

  useEffect(() => {
    setDoneRef.current = false;
    repStateRef.current = createRepState();
    gateStateRef.current = createGateState();
    setReps(0); setGoodReps(0); setGatePhase('positioning');
    setCurrentAngle(null); setRepPhase('up'); setElapsedMs(0);
    setLastDownMs(null); setLastUpMs(null);
    if (exercise) {
      setStepCompleted(new Array(exercise.steps.length).fill(false));
      setCurrentStep(0);
    }
  }, [currentSet]);

  if (!exercise) {
    return (
      <div className="text-center py-20">
        <p className="text-dim">Exercise not found.</p>
        <button onClick={() => navigate('/home')} className="btn-ghost mt-4 text-xs px-4 py-2">Back</button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in -mx-4 -my-4">
      <div className="px-4 py-2 flex items-center justify-between relative z-10 bg-surface-1">
        <button onClick={() => { stop(); navigate(`/exercise/${exercise.id}`); }}
          className="text-dim hover:text-ink transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <p className="font-display font-bold text-xs tracking-[0.2em] text-dim">
          SET {setNumber}/{totalSets}
        </p>
        <div className="w-5" />
      </div>

      <div className="relative mx-2 rounded-2xl overflow-hidden bg-ink/5"
        style={{ height: 'calc(100vh - 160px)', maxHeight: '75vh' }}>
        <video ref={videoRef} muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

        {/* rep count top-center */}
        {stream && !modelLoading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
            <div className="chip px-5 py-2 text-center">
              <span className="font-display font-extrabold text-5xl tabular-nums text-orange leading-none">
                {reps}
              </span>
              <span className="text-[10px] text-dim block">/ {REP_GOAL}</span>
            </div>
          </div>
        )}

        {/* timer bottom-left */}
        {stream && !modelLoading && elapsedMs > 0 && (
          <div className="absolute bottom-14 left-3 z-10">
            <TimerDisplay elapsedMs={elapsedMs} lastDownMs={lastDownMs} lastUpMs={lastUpMs} />
          </div>
        )}

        {/* corner demo bottom-right */}
        {stream && !modelLoading && (
          <div className="absolute bottom-14 right-3 z-10">
            <CornerDemo exerciseId={exercise.id} />
          </div>
        )}

        {/* step strip bottom */}
        {stream && !modelLoading && (
          <div className="absolute bottom-2 left-2 right-2 z-10">
            <StepStrip steps={exercise.steps} currentStep={currentStep} completed={stepCompleted} />
          </div>
        )}

        {/* camera off */}
        {!stream && !starting && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/90">
            <Camera className="w-8 h-8 text-dim/40 mb-3" />
            <p className="text-sm text-dim">Camera is off</p>
            <button onClick={() => { setDoneRef.current = false; start(); }} className="btn-primary text-sm px-6 py-3 mt-4">
              Turn on camera
            </button>
          </div>
        )}
        {starting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/90">
            <Loader2 className="w-6 h-6 text-blue animate-spin mb-2" />
            <p className="text-sm text-dim">Starting camera...</p>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/90 px-6">
            <AlertTriangle className="w-8 h-8 text-red mb-3" />
            <p className="text-red text-sm text-center max-w-xs">{error}</p>
            <button onClick={() => { setDoneRef.current = false; start(); }} className="btn-ghost mt-3 text-xs px-4 py-2">Try again</button>
          </div>
        )}
        {modelLoading && stream && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/80">
            <Loader2 className="w-6 h-6 text-blue animate-spin mb-2" />
            <p className="text-sm text-dim">Loading pose model...</p>
          </div>
        )}
        {modelError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg/90 px-6">
            <AlertTriangle className="w-8 h-8 text-red mb-3" />
            <p className="text-red text-sm text-center">{modelError}</p>
          </div>
        )}
      </div>

      <div className="px-4 py-3 flex items-center justify-between bg-surface-1">
        <div className="text-xs text-dim tabular-nums">
          {currentAngle !== null ? `${Math.round(currentAngle)}\u00B0` : ''}
        </div>
        <button onClick={finishSet} disabled={saving}
          className="text-xs text-dim hover:text-ink transition-colors font-display font-semibold tracking-wider">
          {saving ? 'SAVING...' : reps > 0 ? 'END SET' : 'SKIP'}
        </button>
        <div className="text-xs text-dim tabular-nums">
          {gatePhase === 'counting' ? `${goodReps}/${reps} good` : ''}
        </div>
      </div>
    </div>
  );
}
