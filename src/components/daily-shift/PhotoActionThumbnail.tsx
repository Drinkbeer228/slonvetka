import React from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';

export interface PhotoActionThumbnailProps {
  photoUrl?: string | null;
  isProcessing?: boolean;
  isLocked?: boolean;
  title?: string;
  onCaptureClick: () => void;
  onPreviewClick: () => void;
}

/**
 * Unified PhotoActionPattern component for section card headers:
 * - Empty state: w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200/80 with Camera icon
 * - Attached state: w-11 h-11 rounded-2xl overflow-hidden border-2 border-emerald-400 with preview & ✓ micro-badge
 */
export function PhotoActionThumbnail({
  photoUrl,
  isProcessing = false,
  isLocked = false,
  title,
  onCaptureClick,
  onPreviewClick
}: PhotoActionThumbnailProps) {
  if (photoUrl) {
    const isBase64 = photoUrl.startsWith('data:image') || photoUrl.startsWith('blob:') || photoUrl.startsWith('http');
    const finalUrl = isBase64 ? photoUrl : supabaseService.getPublicUrl(photoUrl);

    return (
      <button
        type="button"
        onClick={onPreviewClick}
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden border-2 border-emerald-400 relative shadow-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all group shrink-0 select-none bg-slate-100"
        title={title || 'Просмотреть / удалить фото'}
        aria-label={title || 'Просмотреть / удалить фото'}
      >
        <img
          src={finalUrl}
          alt="Фото-пруф"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
        {/* Micro-badge with checkmark ✓ */}
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
          ✓
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={isLocked || isProcessing}
      onClick={onCaptureClick}
      className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 flex items-center justify-center text-slate-600 transition-all active:scale-95 shrink-0 touch-manipulation cursor-pointer select-none disabled:opacity-50"
      title={title || 'Зафиксировать на фото'}
      aria-label={title || 'Зафиксировать на фото'}
    >
      {isProcessing ? (
        <RefreshCw size={17} className="animate-spin text-slate-500" />
      ) : (
        <Camera size={17} />
      )}
    </button>
  );
}
