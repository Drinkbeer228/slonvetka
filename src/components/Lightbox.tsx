import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface LightboxProps {
  url: string;
  caption: string;
  onClose: () => void;
}

export function Lightbox({ url, caption, onClose }: LightboxProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    // Prevent scrolling behind modal
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-zinc-900/50 hover:bg-zinc-800 text-white rounded-full transition"
      >
        <X size={24} />
      </button>

      <div 
        className="flex flex-col items-center max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <img 
          src={url} 
          alt={caption} 
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
        <div className="mt-4 text-center">
          <p className="text-white font-medium text-sm md:text-base px-4">{caption}</p>
        </div>
      </div>
    </div>
  );
}
