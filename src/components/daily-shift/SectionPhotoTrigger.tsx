import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { ShiftPhoto } from '../../types/shift';
import { PhotoGallerySheet } from './PhotoGallerySheet';

interface Props {
  section: 'stool' | 'urine' | 'sleep' | 'general';
  photos: ShiftPhoto[];
  onAddPhoto: (photo: ShiftPhoto) => void;
  onRemovePhoto: (id: string) => void;
  totalElephantPhotos: number;
}

export function SectionPhotoTrigger({ section, photos, onAddPhoto, onRemovePhoto, totalElephantPhotos }: Props) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const sectionPhotos = photos.filter(p => p.section === section);
  const count = sectionPhotos.length;

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsSheetOpen(true)}
        className="relative group flex items-center justify-center w-11 h-11 rounded-[16px] bg-white/70 backdrop-blur-md border border-slate-200 shadow-sm transition-all active:scale-95 hover:bg-white"
        title="Прикрепить фото"
      >
        <Camera size={20} className={count > 0 ? 'text-blue-600' : 'text-slate-400'} strokeWidth={count > 0 ? 2.5 : 2} />
        {count > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-white shadow-sm">
            {count}
          </span>
        )}
      </button>

      <PhotoGallerySheet 
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        section={section}
        photos={photos}
        onAddPhoto={onAddPhoto}
        onRemovePhoto={onRemovePhoto}
        totalElephantPhotos={totalElephantPhotos}
      />
    </>
  );
}
