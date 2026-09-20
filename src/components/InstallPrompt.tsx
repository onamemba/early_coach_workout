import { useState, useEffect, useCallback } from 'react';
import { Download, Share, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISSED_KEY = 'coach_install_dismissed';

function isIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandaloneMode() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosTip, setShowIosTip] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;
    if (localStorage.getItem(DISMISSED_KEY)) return;

    if (isIos()) {
      setShowIosTip(true);
      setVisible(true);
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
    localStorage.setItem(DISMISSED_KEY, '1');
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm animate-slide-up">
      <div className="relative flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg ring-1 ring-black/5">
        <button
          onClick={dismiss}
          className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/10"
          aria-label="Dismiss"
        >
          <X size={14} className="text-dim" />
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue/10">
          {showIosTip ? (
            <Share size={20} className="text-blue" />
          ) : (
            <Download size={20} className="text-blue" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          {showIosTip ? (
            <p className="text-sm text-ink leading-snug">
              Tap <Share size={14} className="inline text-blue -mt-0.5" /> then <span className="font-semibold">Add to Home Screen</span> to install.
            </p>
          ) : (
            <p className="text-sm text-ink leading-snug">
              Install <span className="font-semibold">Early Coach</span> for a full-screen experience.
            </p>
          )}
        </div>

        {!showIosTip && deferredPrompt && (
          <button
            onClick={install}
            className="shrink-0 rounded-xl bg-blue px-4 py-2 text-sm font-semibold text-white shadow-sm active:scale-95 transition-transform"
          >
            Install
          </button>
        )}
      </div>
    </div>
  );
}
