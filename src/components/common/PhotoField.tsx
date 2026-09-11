import React, { useRef, useState } from 'react';
import { Camera, X, RefreshCw, Trash2 } from 'lucide-react';

interface PhotoFieldProps {
  dataUrl?: string;
  timestamp?: string;
  onAdd: (dataUrl: string, timestamp: string) => void;
  onRemove: () => void;
  isLocked?: boolean;
}

export function PhotoField({ dataUrl, timestamp, onAdd, onRemove, isLocked }: PhotoFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const processImage = (file: File, callback: (dataUrl: string) => void) => {
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        
        // Max dimension 1200px
        const maxSize = 1200;
        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/webp', 0.75);
          callback(compressedDataUrl);
        }
        setIsProcessing(false);
      };
      img.onerror = () => setIsProcessing(false);
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.onerror = () => setIsProcessing(false);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    processImage(file, (compressedBase64) => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      onAdd(compressedBase64, timeStr);
      // Reset input
      e.target.value = '';
    });
  };

  if (dataUrl) {
    return (
      <>
        {/* Loaded State */}
        <div className="flex items-center gap-3 bg-white/40 border border-white/50 rounded-[20px] p-2 pr-3 w-fit shadow-sm">
          <div 
            className="relative w-[64px] h-[64px] rounded-2xl overflow-hidden cursor-pointer group shrink-0 shadow-sm border border-black/5"
            onClick={() => setIsLightboxOpen(true)}
          >
            <img src={dataUrl} alt="Снимок" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            {timestamp && (
              <div className="absolute bottom-1 left-1 bg-black/60 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                {timestamp}
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>

          {!isLocked && (
            <div className="flex flex-col gap-1.5 shrink-0">
              <button 
                onClick={() => replaceInputRef.current?.click()}
                className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 bg-white/70 hover:bg-white px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
              >
                <RefreshCw size={12} />
                Заменить
              </button>
              <button 
                onClick={onRemove}
                className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 bg-white/70 hover:bg-red-50 px-2.5 py-1.5 rounded-lg active:scale-95 transition-all"
              >
                <Trash2 size={12} />
                Удалить
              </button>
            </div>
          )}
        </div>

        {/* Hidden Replace Input */}
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          ref={replaceInputRef}
          onChange={handleFileChange}
        />

        {/* Lightbox */}
        {isLightboxOpen && (
          <div className="fixed inset-0 z-[100] flex flex-col bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-200">
            <div className="flex-1 w-full h-full p-4 flex items-center justify-center relative">
              <img 
                src={dataUrl} 
                alt="Полноэкранный снимок" 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl drop-shadow-2xl animate-in zoom-in-95 duration-200" 
              />
              {timestamp && (
                <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-md text-white text-sm font-bold px-3 py-1.5 rounded-lg">
                  {timestamp}
                </div>
              )}
            </div>
            <div className="p-6 bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent flex gap-4">
              <button 
                onClick={() => setIsLightboxOpen(false)}
                className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold backdrop-blur-md transition-all active:scale-95"
              >
                Закрыть
              </button>
              {!isLocked && (
                <button 
                  onClick={() => {
                    onRemove();
                    setIsLightboxOpen(false);
                  }}
                  className="flex-1 py-4 bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-2xl font-bold backdrop-blur-md transition-all active:scale-95 border border-red-500/30 flex justify-center items-center gap-2"
                >
                  <Trash2 size={18} />
                  Удалить снимок
                </button>
              )}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isLocked || isProcessing}
        className="flex items-center justify-center gap-2 px-4 py-3 bg-white/60 hover:bg-white/80 border border-white/40 shadow-sm rounded-2xl text-slate-700 font-bold active:scale-95 transition-all text-sm disabled:opacity-50"
      >
        {isProcessing ? (
          <RefreshCw size={18} className="animate-spin text-slate-400" />
        ) : (
          <Camera size={18} className="text-slate-500" />
        )}
        {isProcessing ? 'Обработка...' : 'Добавить фото'}
      </button>

      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        className="hidden" 
        ref={fileInputRef}
        onChange={handleFileChange}
      />
    </>
  );
}
