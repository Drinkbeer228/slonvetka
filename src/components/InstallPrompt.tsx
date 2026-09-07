import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  if (!deferredPrompt) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 w-[calc(100%-2rem)] sm:w-auto max-w-sm">
      <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
        <span className="text-xl">🐘</span>
      </div>
      <div className="flex-1">
        <div className="font-bold text-sm">Установить СлоноВет</div>
        <div className="text-xs text-zinc-400 font-medium">Для работы без интернета</div>
      </div>
      <button 
        onClick={handleInstallClick}
        className="bg-white text-zinc-900 px-4 py-2 rounded-xl text-sm font-black active:scale-95 transition whitespace-nowrap flex items-center gap-1.5"
      >
        <Download size={16} />
        На экран
      </button>
    </div>
  );
}
