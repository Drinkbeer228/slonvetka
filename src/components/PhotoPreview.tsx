import React, { useState, useEffect } from 'react';
import { TreatmentPhoto } from '../types';
import { supabaseService } from '../services/supabaseService';
import { Loader2 } from 'lucide-react';
import { Lightbox } from './Lightbox';

interface PhotoPreviewProps {
  key?: string | number;
  photo: TreatmentPhoto;
  caption: string;
}

export function PhotoPreview({ photo, caption }: PhotoPreviewProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadSignedUrl() {
      try {
        const signedUrl = await supabaseService.getSignedUrl(photo.storage_path);
        if (mounted) {
          setUrl(signedUrl);
        }
      } catch (err) {
        console.error('Failed to load signed url', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadSignedUrl();
    return () => { mounted = false; };
  }, [photo.storage_path]);

  if (loading) {
    return (
      <div className="w-16 h-16 shrink-0 rounded-lg border border-zinc-200 bg-zinc-100 flex items-center justify-center">
        <Loader2 size={16} className="text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (!url) {
    return (
      <div className="w-16 h-16 shrink-0 rounded-lg border border-zinc-200 bg-zinc-100 flex items-center justify-center text-xs text-zinc-400 font-bold text-center p-1">
        Ошибка
      </div>
    );
  }

  return (
    <>
      <div 
        onClick={() => setLightboxOpen(true)}
        className="w-16 h-16 shrink-0 rounded-lg overflow-hidden border border-zinc-200 bg-black cursor-pointer hover:opacity-80 transition active:scale-95"
      >
        <img 
          src={url} 
          alt="Фото" 
          className="w-full h-full object-cover" 
        />
      </div>

      {lightboxOpen && (
        <Lightbox 
          url={url}
          caption={caption}
          onClose={() => setLightboxOpen(false)}
        />
      )}
    </>
  );
}
