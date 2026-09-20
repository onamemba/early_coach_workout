import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Exercise } from '@/lib/types';
import { useAuthStore } from '@/store/authStore';
import { Upload, Loader2, Check } from 'lucide-react';

interface DemoVideoProps {
  exercise: Exercise;
}

export default function DemoVideo({ exercise }: DemoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const loopStartRef = useRef<number | null>(null);
  const loopEndRef = useRef<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasVideo, setHasVideo] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadDone, setUploadDone] = useState(false);
  const { user } = useAuthStore();

  const fetchVideo = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('exercise_videos').select('*').eq('exercise_id', exercise.id).maybeSingle();
    loopStartRef.current = data?.loop_start_s ?? null;
    loopEndRef.current = data?.loop_end_s ?? null;
    if (data?.storage_path) {
      const { data: pub } = supabase.storage.from('exercise-videos').getPublicUrl(data.storage_path);
      if (pub?.publicUrl) {
        setVideoUrl(pub.publicUrl + '?t=' + Date.now());
        setHasVideo(true); setLoading(false); return;
      }
    }
    setHasVideo(false); setLoading(false);
  }, [exercise.id]);

  useEffect(() => { fetchVideo(); }, [fetchVideo]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !videoUrl) return;
    const onTimeUpdate = () => {
      const end = loopEndRef.current;
      if (end !== null && v.currentTime >= end) v.currentTime = loopStartRef.current ?? 0;
    };
    v.addEventListener('timeupdate', onTimeUpdate);
    return () => { v.removeEventListener('timeupdate', onTimeUpdate); };
  }, [videoUrl]);

  const handleUpload = async (file: File) => {
    setUploading(true); setUploadDone(false);
    const path = `${exercise.id}/${file.name}`;
    const { error: upErr } = await supabase.storage.from('exercise-videos').upload(path, file, { upsert: true });
    if (!upErr) {
      await supabase.from('exercise_videos').upsert({ exercise_id: exercise.id, storage_path: path });
      setUploadDone(true);
      await fetchVideo();
      setTimeout(() => setUploadDone(false), 2000);
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="w-full aspect-[9/16] max-h-[70vh] bg-surface-2 rounded-2xl flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-blue/30 border-t-blue rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative">
      {hasVideo ? (
        <div className="w-full aspect-[9/16] max-h-[70vh] bg-ink/5 rounded-2xl overflow-hidden">
          <video
            ref={videoRef} src={videoUrl ?? undefined}
            loop muted playsInline autoPlay
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full aspect-[9/16] max-h-[70vh] bg-surface-2 rounded-2xl flex items-center justify-center">
          <div className="text-center px-6">
            <div className="w-16 h-16 rounded-full bg-blue/10 flex items-center justify-center mx-auto mb-3 glow-blue">
              <span className="font-display font-bold text-2xl text-blue">{exercise.name[0]}</span>
            </div>
            <p className="text-sm text-dim">{exercise.cue}</p>
          </div>
        </div>
      )}
      {user && (
        <label className="absolute bottom-3 right-3 flex items-center gap-1.5 cursor-pointer bg-white/80 backdrop-blur-sm border border-surface-3 rounded-lg px-3 py-1.5 text-xs text-dim hover:text-ink transition-colors">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
           uploadDone ? <Check className="w-3.5 h-3.5 text-green" /> :
           <><Upload className="w-3.5 h-3.5" />{hasVideo ? 'Replace' : 'Upload'}
           <input type="file" accept="video/*" className="hidden"
             onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} /></>}
        </label>
      )}
    </div>
  );
}
