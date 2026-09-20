import { useEffect, useState, useCallback } from 'react';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'pwa-install-dismissed';

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !('MSStream' in window);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches
    || ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone);
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIOS, setShowIOS] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    if (isIOS()) {
      if (!localStorage.getItem(DISMISSED_KEY)) {
        setShowIOS(true);
        setVisible(true);
      }
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, '1');
    if (showIOS) localStorage.setItem(DISMISSED_KEY, '1');
  }, [showIOS]);

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-lg mx-auto animate-slide-up">
      <div className="relative bg-surface-1 border border-surface-3 rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3">
        <button
          onClick={dismiss}
          className="absolute top-2 right-2 p-1 text-dim hover:text-ink transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        {showIOS ? (
          <>
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue/10 flex items-center justify-center">
              <Share className="w-4.5 h-4.5 text-blue" />
            </div>
            <div className="flex-1 min-w-0 pr-5">
              <p className="text-sm font-display font-semibold text-ink leading-tight">Install Coach</p>
              <p className="text-xs text-dim mt-0.5 leading-snug">
                Tap <Share className="inline w-3 h-3 -mt-0.5 text-blue" /> then <span className="font-semibold text-ink">Add to Home Screen</span>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-blue/10 flex items-center justify-center">
              <Download className="w-4.5 h-4.5 text-blue" />
            </div>
            <div className="flex-1 min-w-0 pr-5">
              <p className="text-sm font-display font-semibold text-ink leading-tight">Install Coach</p>
              <p className="text-xs text-dim mt-0.5">Get the full app experience</p>
            </div>
            <button
              onClick={handleInstall}
              className="flex-shrink-0 bg-blue hover:bg-blue/90 active:scale-95 text-white text-xs font-display font-semibold tracking-wider px-4 py-2 rounded-xl transition-all"
            >
              Install
            </button>
          </>
        )}
      </div>
    </div>
  );
}
