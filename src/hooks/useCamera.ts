import { useCallback, useRef, useState } from 'react';

export interface CameraState {
  stream: MediaStream | null;
  error: string | null;
  starting: boolean;
}

function isIOSNonSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!isIOS) return false;
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdiOS|OPiOS/.test(ua);
  return !isSafari;
}

function isSecureContext(): boolean {
  return window.isSecureContext || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
}

export function useCamera() {
  const [state, setState] = useState<CameraState>({ stream: null, error: null, starting: false });
  const videoRef = useRef<HTMLVideoElement>(null);

  const start = useCallback(async () => {
    setState({ stream: null, error: null, starting: true });

    if (!isSecureContext()) {
      setState({ stream: null, error: 'Camera needs a secure (HTTPS) connection. Please use the deployed site or localhost.', starting: false });
      return;
    }

    if (isIOSNonSafari()) {
      setState({ stream: null, error: 'On iPhone/iPad, only Safari can access the camera. Please open this page in Safari.', starting: false });
      return;
    }

    if (window.self !== window.top) {
      setState({ stream: null, error: 'Camera access is blocked inside an embedded frame. Open this page in its own tab.', starting: false });
      return;
    }

    const constraintsList: MediaStreamConstraints[] = [
      { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } },
      { video: { facingMode: 'user' } },
      { video: true },
    ];

    let stream: MediaStream | null = null;
    let lastErr: unknown = null;

    for (const constraints of constraintsList) {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        break;
      } catch (err) {
        lastErr = err;
      }
    }

    if (!stream) {
      const err = lastErr as DOMError;
      let msg = 'Could not start the camera.';
      if (err?.name === 'NotAllowedError') {
        msg = 'Camera access was denied. Please allow camera permissions in your browser settings and try again.';
      } else if (err?.name === 'NotFoundError') {
        msg = 'No camera found. Please connect a webcam and try again.';
      } else if (err?.name === 'NotReadableError') {
        msg = 'The camera is busy. Close any other app using the camera (Zoom, Teams, etc.) and try again.';
      }
      setState({ stream: null, error: msg, starting: false });
      return;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(() => {});
    }

    setState({ stream, error: null, starting: false });
  }, []);

  const stop = useCallback(() => {
    setState((prev) => {
      prev.stream?.getTracks().forEach((t) => t.stop());
      if (videoRef.current) videoRef.current.srcObject = null;
      return { stream: null, error: null, starting: false };
    });
  }, []);

  return { ...state, videoRef, start, stop };
}

interface DOMError {
  name?: string;
  message?: string;
}
