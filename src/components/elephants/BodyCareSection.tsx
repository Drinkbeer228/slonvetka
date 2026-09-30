import React, { useState, useRef } from 'react';
import {
  Camera, Check, AlertTriangle, AlertCircle, Sparkles, Image as ImageIcon,
  Eye, X, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp
} from 'lucide-react';
import type { ElephantDailyMetrics, WashStatus, LimbCondition } from '../../types/shift';
import { compressImage } from '../../utils/imageCompressor';
import { supabaseService } from '../../services/supabaseService';

interface BodyCareSectionProps {
  elephantId: string;
  elephantName: string;
  metric: ElephantDailyMetrics;
  onSetWashStatus: (status: WashStatus) => void;
  onSetLimbCondition: (limb: 'front_right' | 'front_left' | 'rear_right' | 'rear_left', condition: LimbCondition) => void;
  onSaveFeetPhoto: (limb: 'front_right' | 'front_left' | 'rear_right' | 'rear_left', photoUrl: string) => void;
  onUpdateTemporalGland?: (data: {
    score: number;
    washed: boolean;
    ointment: boolean;
    photoUrl?: string;
  }) => void;
  triggerHaptic?: (ms?: number) => void;
}

const WASH_OPTIONS: { value: WashStatus; label: string; emoji: string }[] = [
  { value: 'not_washed', label: 'Не мыта', emoji: '❌' },
  { value: 'rinsed', label: 'Ополоснута', emoji: '💦' },
  { value: 'full_wash', label: 'Со щёткой', emoji: '✨' },
];

const LIMBS = [
  { id: 'front_right' as const, code: 'ПП', title: 'Передняя Правая' },
  { id: 'front_left' as const, code: 'ЛП', title: 'Передняя Левая' },
  { id: 'rear_right' as const, code: 'ПЗ', title: 'Задняя Правая' },
  { id: 'rear_left' as const, code: 'ЛЗ', title: 'Задняя Левая' },
];

const LIMB_CONDITIONS: { value: LimbCondition; label: string; badge: string; color: string }[] = [
  { value: 'ok', label: 'Норма', badge: '🟢 Норма', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { value: 'crack', label: 'Трещина', badge: '⚠️ Трещина', color: 'text-amber-300 border-amber-500/40 bg-amber-500/15' },
  { value: 'sole_issue', label: 'Подошва', badge: '⚠️ Подошва', color: 'text-amber-300 border-amber-500/40 bg-amber-500/15' },
  { value: 'lameness', label: 'Хромота', badge: '🔴 Хромота', color: 'text-rose-300 border-rose-500/50 bg-rose-500/20' },
];

const TGS_LEVELS = [
  { score: 0, label: '0: Сухо', desc: 'Впадина чистая, норма' },
  { score: 1, label: '1: Влажно', desc: 'Лёгкий секрет / полоска' },
  { score: 2, label: '2: Умеренно', desc: 'Капли, припухлость' },
  { score: 3, label: '3: Обильно', desc: 'Стекает к щеке / глазу' },
  { score: 4, label: '4: Отёк', desc: 'Выраженное воспаление' },
];

/**
 * Единый монолитный блок «Тело, Лапы и Спец-уход»
 * Объединяет:
 * 1. Мойку туши
 * 2. Статус 4 конечностей + фото в 1 тап
 * 3. [Только для Претти] Височные доли TGS 0-4 + обработка мазью
 */
export function BodyCareSection({
  elephantId,
  elephantName,
  metric,
  onSetWashStatus,
  onSetLimbCondition,
  onSaveFeetPhoto,
  onUpdateTemporalGland,
  triggerHaptic,
}: BodyCareSectionProps) {
  const isPretty =
    elephantId === 'pretty' ||
    elephantName.toLowerCase().includes('претти') ||
    elephantName.toLowerCase().includes('прэтти');

  const washStatus = metric.wash_status || 'not_washed';
  const limbs = metric.limb_status || {
    front_right: 'ok',
    front_left: 'ok',
    rear_right: 'ok',
    rear_left: 'ok',
  };
  const feetPhotos = metric.feet_photos || {};

  // Active expanded limb for editing condition
  const [selectedLimb, setSelectedLimb] = useState<'front_right' | 'front_left' | 'rear_right' | 'rear_left' | null>(null);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

  // File inputs for 4 feet
  const feetInputRefs = {
    front_right: useRef<HTMLInputElement>(null),
    front_left: useRef<HTMLInputElement>(null),
    rear_right: useRef<HTMLInputElement>(null),
    rear_left: useRef<HTMLInputElement>(null),
  };

  // File input for temporal gland
  const glandInputRef = useRef<HTMLInputElement>(null);

  const handleFeetPhotoSelect = async (
    limb: 'front_right' | 'front_left' | 'rear_right' | 'rear_left',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic?.(20);
    try {
      const compressedBlob = await compressImage(file);
      let photoUrl = '';
      try {
        const today = new Date().toISOString().split('T')[0];
        const storagePath = await supabaseService.uploadShiftMedia(compressedBlob, today, `foot_${limb}`);
        photoUrl = supabaseService.getPublicUrl(storagePath);
      } catch (uploadErr) {
        // Fallback for offline: transient dataUrl
        photoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(compressedBlob);
        });
      }
      onSaveFeetPhoto(limb, photoUrl);
    } catch (err) {
      console.error('Error compressing feet photo:', err);
    } finally {
      e.target.value = '';
    }
  };

  const handleGlandPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    triggerHaptic?.(20);
    try {
      const compressedBlob = await compressImage(file);
      let photoUrl = '';
      try {
        const today = new Date().toISOString().split('T')[0];
        const storagePath = await supabaseService.uploadShiftMedia(compressedBlob, today, 'temporal_gland');
        photoUrl = supabaseService.getPublicUrl(storagePath);
      } catch {
        photoUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(compressedBlob);
        });
      }

      onUpdateTemporalGland?.({
        score: metric.temporal_gland_score ?? 0,
        washed: metric.temporal_gland_washed ?? false,
        ointment: metric.temporal_gland_ointment ?? false,
        photoUrl,
      });
    } catch (err) {
      console.error('Error compressing temporal gland photo:', err);
    } finally {
      e.target.value = '';
    }
  };

  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-2xl space-y-4">
      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
            Уход и ортопедия • {elephantName}
          </p>
          <h2 className="mt-0.5 text-lg font-bold text-white tracking-tight">
            Тело, Лапы и Педикюр
          </h2>
        </div>
        <div className="text-2xl">🚿</div>
      </div>

      {/* ═══ 1. МОЙКА ТУШИ ═══ */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-2">
        <span className="text-xs font-bold text-zinc-300">Мойка слонихи:</span>
        <div className="grid grid-cols-3 gap-1.5">
          {WASH_OPTIONS.map((opt) => {
            const isSelected = washStatus === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  triggerHaptic?.(12);
                  onSetWashStatus(opt.value);
                }}
                className={`min-h-[46px] rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer touch-manipulation ${
                  isSelected
                    ? 'bg-blue-600 border-blue-500 text-white font-black shadow-md shadow-blue-600/30'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>{opt.emoji}</span>
                <span className="break-words">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ 2. 4 КОНЕЧНОСТИ (ПП, ЛП, ПЗ, ЛЗ) ➔ СТАТУС + ФОТО В 1 ТАП ═══ */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-200">
            Состояние 4 лап и фото:
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">
            {Object.keys(feetPhotos).length}/4 фото
          </span>
        </div>

        {/* Сетка 4 лап */}
        <div className="grid grid-cols-2 gap-2">
          {LIMBS.map((limb) => {
            const currentCondition = limbs[limb.id] || 'ok';
            const condConfig = LIMB_CONDITIONS.find((c) => c.value === currentCondition) || LIMB_CONDITIONS[0];
            const hasPhoto = Boolean(feetPhotos[limb.id]?.url);
            const isSelected = selectedLimb === limb.id;

            return (
              <div
                key={limb.id}
                className={`rounded-2xl border p-2.5 transition flex flex-col justify-between gap-2 ${
                  currentCondition !== 'ok'
                    ? 'border-amber-500/50 bg-amber-950/20'
                    : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                {/* Upper row: Code + Status Badge */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-zinc-950 border border-zinc-800 font-black text-xs text-white">
                      {limb.code}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-300 leading-tight">
                      {limb.title.split(' ')[0]}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      triggerHaptic?.(10);
                      setSelectedLimb(isSelected ? null : limb.id);
                    }}
                    className={`px-2 py-0.5 rounded-lg border text-[10px] font-bold transition active:scale-95 cursor-pointer touch-manipulation ${condConfig.color}`}
                  >
                    {condConfig.badge}
                  </button>
                </div>

                {/* Lower row: Photo status and capture */}
                <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-zinc-800/60">
                  <input
                    ref={feetInputRefs[limb.id]}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => handleFeetPhotoSelect(limb.id, e)}
                  />

                  {hasPhoto ? (
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <div
                        onClick={() => setZoomPhotoUrl(feetPhotos[limb.id]?.url || null)}
                        className="h-8 w-8 rounded-lg overflow-hidden border border-zinc-700 bg-black shrink-0 cursor-pointer"
                      >
                        <img
                          src={feetPhotos[limb.id]?.url}
                          alt={limb.code}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => feetInputRefs[limb.id].current?.click()}
                        className="text-[10px] text-zinc-400 hover:text-white underline cursor-pointer"
                      >
                        Переснять
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic?.(12);
                        feetInputRefs[limb.id].current?.click();
                      }}
                      className="flex-1 min-h-[36px] rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-xs font-bold flex items-center justify-center gap-1 transition active:scale-95 cursor-pointer touch-manipulation"
                    >
                      <Camera size={14} />
                      <span>Фото {limb.code}</span>
                    </button>
                  )}
                </div>

                {/* Dropdown condition picker when tapped */}
                {isSelected && (
                  <div className="pt-2 border-t border-zinc-800 grid grid-cols-2 gap-1 animate-slide-up">
                    {LIMB_CONDITIONS.map((cond) => (
                      <button
                        key={cond.value}
                        type="button"
                        onClick={() => {
                          triggerHaptic?.(15);
                          onSetLimbCondition(limb.id, cond.value);
                          setSelectedLimb(null);
                        }}
                        className={`min-h-[34px] px-1.5 rounded-lg text-[10px] font-bold border transition ${
                          currentCondition === cond.value
                            ? cond.color + ' font-black'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                        }`}
                      >
                        {cond.badge}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ═══ 3. СПЕЦ-БЛОК ПРЕТТИ (ВИСОЧНАЯ ЖЕЛЕЗА TGS 0-4 + МАЗЬ) ═══ */}
      {isPretty && onUpdateTemporalGland && (
        <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-950/20 p-4 space-y-3.5 shadow-lg shadow-amber-950/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-500 text-zinc-950 text-sm font-black">
                !
              </span>
              <div>
                <h3 className="text-sm font-black text-amber-300 tracking-tight">
                  Височные железы (Претти)
                </h3>
                <p className="text-[11px] text-zinc-400">
                  Шкала TGS 0–4 • Антисептик и мазь
                </p>
              </div>
            </div>

            <span className="rounded-full bg-zinc-950 border border-zinc-800 px-2.5 py-1 text-xs font-mono font-bold text-amber-400">
              TGS: {metric.temporal_gland_score ?? 0}/4
            </span>
          </div>

          {/* TGS Buttons */}
          <div className="grid grid-cols-5 gap-1.5">
            {TGS_LEVELS.map((tgs) => {
              const isSelected = (metric.temporal_gland_score ?? 0) === tgs.score;
              return (
                <button
                  key={tgs.score}
                  type="button"
                  onClick={() => {
                    triggerHaptic?.(12);
                    onUpdateTemporalGland({
                      score: tgs.score,
                      washed: metric.temporal_gland_washed ?? false,
                      ointment: metric.temporal_gland_ointment ?? false,
                      photoUrl: metric.temporal_gland_photo_url,
                    });
                  }}
                  className={`min-h-[46px] rounded-xl border p-1 text-center transition flex flex-col items-center justify-center active:scale-95 cursor-pointer touch-manipulation ${
                    isSelected
                      ? tgs.score >= 3
                        ? 'bg-rose-500 border-rose-400 text-white font-black'
                        : 'bg-amber-500 border-amber-400 text-zinc-950 font-black'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span className="text-xs font-mono font-bold">{tgs.score}</span>
                  <span className="text-[9px] break-words leading-tight">{tgs.label.split(':')[1]}</span>
                </button>
              );
            })}
          </div>

          {/* Action Checkboxes + Photo */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                triggerHaptic?.(12);
                onUpdateTemporalGland({
                  score: metric.temporal_gland_score ?? 0,
                  washed: !(metric.temporal_gland_washed ?? false),
                  ointment: metric.temporal_gland_ointment ?? false,
                  photoUrl: metric.temporal_gland_photo_url,
                });
              }}
              className={`min-h-[46px] rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation ${
                metric.temporal_gland_washed
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}
            >
              <span>💧</span>
              <span>{metric.temporal_gland_washed ? 'Промыта ✓' : 'Промыть'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic?.(12);
                onUpdateTemporalGland({
                  score: metric.temporal_gland_score ?? 0,
                  washed: metric.temporal_gland_washed ?? false,
                  ointment: !(metric.temporal_gland_ointment ?? false),
                  photoUrl: metric.temporal_gland_photo_url,
                });
              }}
              className={`min-h-[46px] rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation ${
                metric.temporal_gland_ointment
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-black'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400'
              }`}
            >
              <span>🧴</span>
              <span>{metric.temporal_gland_ointment ? 'Мазь нанесена ✓' : 'Нанести мазь'}</span>
            </button>
          </div>

          {/* Gland photo */}
          <div className="pt-1">
            <input
              ref={glandInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleGlandPhotoSelect}
            />
            {metric.temporal_gland_photo_url ? (
              <div className="flex items-center gap-2">
                <div
                  onClick={() => setZoomPhotoUrl(metric.temporal_gland_photo_url || null)}
                  className="h-10 w-10 rounded-xl overflow-hidden border border-zinc-700 bg-black shrink-0 cursor-pointer"
                >
                  <img src={metric.temporal_gland_photo_url} alt="Височная железа" className="h-full w-full object-cover" />
                </div>
                <span className="text-xs text-emerald-400 font-bold">Фото железы зафиксировано ✓</span>
                <button
                  type="button"
                  onClick={() => glandInputRef.current?.click()}
                  className="text-xs text-zinc-400 underline ml-auto cursor-pointer"
                >
                  Переснять
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => glandInputRef.current?.click()}
                className="w-full min-h-[44px] rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer touch-manipulation"
              >
                <Camera size={16} />
                <span>Фото височной железы</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Photo Zoom Modal */}
      {zoomPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoomPhotoUrl(null)}
        >
          <div className="relative max-h-[85vh] max-w-full">
            <img src={zoomPhotoUrl} alt="Zoom" className="max-h-[80vh] w-auto rounded-2xl object-contain" />
            <button
              type="button"
              onClick={() => setZoomPhotoUrl(null)}
              className="absolute top-2 right-2 h-9 w-9 rounded-full bg-zinc-900/80 text-white flex items-center justify-center cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
