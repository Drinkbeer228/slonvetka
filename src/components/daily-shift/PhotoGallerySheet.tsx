import React, { useRef, useState } from 'react';
import { Camera, Trash2, X, Plus } from 'lucide-react';
import { ShiftPhoto } from '../../types/shift';
import { compressImage } from '../../utils/imageCompression';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  section: 'stool' | 'urine' | 'sleep' | 'general';
  photos: ShiftPhoto[];
  onAddPhoto: (photo: ShiftPhoto) => void;
  onRemovePhoto: (id: string) => void;
  totalElephantPhotos: number;
}

export function PhotoGallerySheet({ isOpen, onClose, section, photos, onAddPhoto, onRemovePhoto, totalElephantPhotos }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const MAX_PHOTOS = 30;
  
  if (!isOpen) return null;

  const sectionPhotos = photos.filter(p => p.section === section);
  const canAddMore = totalElephantPhotos < MAX_PHOTOS;

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canAddMore) {
      alert(`Достигнут лимит фотографий (${MAX_PHOTOS}) для данного слона.`);
      return;
    }

    try {
      setIsCompressing(true);
      const dataUrl = await compressImage(file);
      
      const newPhoto: ShiftPhoto = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        section,
        dataUrl
      };
      
      onAddPhoto(newPhoto);
    } catch (err) {
      console.error('Failed to compress/add photo', err);
      alert('Не удалось обработать фото');
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getSectionTitle = () => {
    switch(section) {
      case 'stool': return 'Стул';
      case 'urine': return 'Моча';
      case 'sleep': return 'Сон';
      case 'general': return 'Общее состояние';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" 
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="relative bg-white w-full rounded-t-[32px] shadow-2xl flex flex-col h-[70vh] sm:h-[80vh] animate-in slide-in-from-bottom duration-300">
        
        {/* Drag handle */}
        <div className="w-full flex justify-center pt-3 pb-2" onClick={onClose}>
          <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-6 pb-4 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-xl font-black text-slate-800">Фото: {getSectionTitle()}</h3>
            <p className="text-xs font-bold text-slate-400 mt-0.5">Лимит: {totalElephantPhotos}/{MAX_PHOTOS} фото</p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center active:scale-95 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            
            {/* Take photo button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={!canAddMore || isCompressing}
              className={`aspect-square rounded-[24px] border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${canAddMore ? 'border-slate-300 bg-slate-50 text-slate-600 hover:border-slate-400 hover:bg-slate-100' : 'border-slate-200 bg-slate-50 text-slate-400 opacity-50'}`}
            >
              {isCompressing ? (
                <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-slate-600 animate-spin" />
              ) : (
                <>
                  <Camera size={28} />
                  <span className="text-[11px] font-bold uppercase tracking-widest">{canAddMore ? 'Сделать фото' : 'Лимит'}</span>
                </>
              )}
            </button>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleCapture}
            />

            {/* Grid of photos */}
            {sectionPhotos.map(photo => {
              const timeStr = new Date(photo.timestamp).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={photo.id} className="aspect-square relative rounded-[24px] overflow-hidden group shadow-sm bg-slate-100">
                  <img src={photo.dataUrl} alt="Photo" className="w-full h-full object-cover" />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-100" />
                  
                  {/* Timestamp */}
                  <div className="absolute bottom-3 left-3 text-white text-xs font-bold drop-shadow-md">
                    {timeStr}
                  </div>
                  
                  {/* Delete button */}
                  <button 
                    onClick={() => onRemovePhoto(photo.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full text-white flex items-center justify-center active:scale-90 transition-all opacity-100"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
