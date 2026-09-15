import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Check, AlertTriangle, X } from 'lucide-react';
import { RecipeBottomSheet } from './RecipeBottomSheet';
import { SaladTechModal } from './SaladTechModal';

export interface DailyRationData {
  // Legacy / existing fields for full backward compatibility:
  morning_porridge?: 'none' | 'all' | 'partial' | 'refused';
  morning_porridge_time?: string | null;
  morning_porridge_keeper?: string | null;
  morning_porridge_photo?: string | null;
  evening_salad_chips: string[];
  salad_notes: string;
  coarse_branches?: number;
  salad_base_included?: boolean;
  salad_photo_url?: string;
  salad_appetite?: 'all' | 'partial' | 'refused' | null;
  salad_base_time?: string | null;

  // Veterinary feeding rules fields:
  morning_mash_fed?: boolean;
  morning_mash_time?: string | null;
  is_show_day?: boolean;
  noon_mash_status?: 'pending' | 'fed' | 'skipped_show_day';
  noon_mash_cooldown_confirmed?: boolean;
  noon_mash_time?: string | null;
  evening_diet_fed?: boolean;
  evening_diet_time?: string | null;
}

export interface FeedControlProps {
  ration: DailyRationData;
  isLocked?: boolean;
  dutyKeeperName?: string;
  onPorridgeFieldChange: (field: keyof DailyRationData | Partial<DailyRationData>, value?: any) => void;
  // Optional / backward-compatible props:
  hayBalesDistributed?: number;
  hayBagsDistributed?: number;
  onBalesChange?: (val: number) => void;
  onBagsChange?: (val: number) => void;
  onVegetableToggle?: (chip: string) => void;
  onSaladNotesChange?: (notes: string) => void;
  onBranchesChange?: (val: number) => void;
  onSaladBaseToggle?: (included: boolean) => void;
  onSaladPhotoChange?: (photoUrl?: string) => void;
}

export function FeedControl({
  ration,
  isLocked = false,
  onPorridgeFieldChange
}: FeedControlProps) {
  // Modals state
  const [isRecipeOpen, setIsRecipeOpen] = useState(false);
  const [isSaladTechOpen, setIsSaladTechOpen] = useState(false);
  const [isCooldownModalOpen, setIsCooldownModalOpen] = useState(false);

  // Haptic feedback helper
  const handleHaptic = (pattern: number | number[] = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore haptic errors on unsupported platforms
      }
    }
  };

  // 1. Show Day Toggle Handler (cancels both morning and noon mash)
  const handleToggleShowDay = () => {
    if (isLocked) return;
    const nextShowDay = !ration.is_show_day;
    handleHaptic(25);

    if (nextShowDay) {
      onPorridgeFieldChange({
        is_show_day: true,
        noon_mash_status: 'skipped_show_day'
      });
    } else {
      onPorridgeFieldChange({
        is_show_day: false,
        noon_mash_status: ration.noon_mash_status === 'skipped_show_day' ? 'pending' : (ration.noon_mash_status || 'pending')
      });
    }
  };

  // 2. Morning Mash (07:00)
  const isMorningFed = Boolean(
    ration.morning_mash_fed ?? 
    (ration.morning_porridge && ration.morning_porridge !== 'none')
  );

  const handleToggleMorning = () => {
    if (isLocked || ration.is_show_day) return;
    handleHaptic(15);
    if (isMorningFed) {
      onPorridgeFieldChange({
        morning_mash_fed: false,
        morning_mash_time: null,
        morning_porridge: 'none'
      });
    } else {
      const nowTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      onPorridgeFieldChange({
        morning_mash_fed: true,
        morning_mash_time: nowTime,
        morning_porridge: 'all',
        morning_porridge_time: nowTime
      });
    }
  };

  // 3. Noon Mash (After rehearsal)
  const isNoonFed = ration.noon_mash_status === 'fed';

  const handleNoonAction = () => {
    if (isLocked || ration.is_show_day) return;
    if (isNoonFed) {
      handleHaptic(10);
      onPorridgeFieldChange({
        noon_mash_status: 'pending',
        noon_mash_cooldown_confirmed: false,
        noon_mash_time: null
      });
    } else {
      handleHaptic(20);
      setIsCooldownModalOpen(true);
    }
  };

  const handleConfirmNoonMash = () => {
    if (isLocked || ration.is_show_day) return;
    handleHaptic([20, 40, 20]);
    const nowTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    onPorridgeFieldChange({
      noon_mash_status: 'fed',
      noon_mash_cooldown_confirmed: true,
      noon_mash_time: nowTime
    });
    setIsCooldownModalOpen(false);
  };

  // 4. Evening Diet (19:00) - remains active even on show days
  const isEveningFed = Boolean(
    ration.evening_diet_fed ?? 
    ration.salad_base_included
  );

  const handleToggleEvening = () => {
    if (isLocked) return;
    handleHaptic(15);
    if (isEveningFed) {
      onPorridgeFieldChange({
        evening_diet_fed: false,
        evening_diet_time: null,
        salad_base_included: false
      });
    } else {
      const nowTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      onPorridgeFieldChange({
        evening_diet_fed: true,
        evening_diet_time: nowTime,
        salad_base_included: true,
        salad_base_time: nowTime
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* СЕКЦИОННЫЙ ЗАГОЛОВОК */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">🥣</span>
          <span className="font-extrabold text-slate-900 text-sm tracking-tight">Рацион / Концентраты</span>
        </div>
      </div>

      {/* КАРТОЧКА ТУМБЛЕРА «🎪 СЕГОДНЯ ДЕНЬ ШОУ» */}
      <div
        onClick={handleToggleShowDay}
        className={`h-12 border rounded-[16px] px-3.5 flex items-center justify-between cursor-pointer transition-all active:scale-[0.99] touch-manipulation select-none ${
          ration.is_show_day
            ? 'bg-rose-500/10 border-rose-500/25'
            : 'bg-amber-500/10 border-amber-500/25'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-base leading-none shrink-0">🎪</span>
          <span className={`text-xs font-bold truncate ${ration.is_show_day ? 'text-rose-900' : 'text-amber-900'}`}>
            {ration.is_show_day ? 'Сегодня день шоу (каши отменены)' : 'Сегодня день шоу / представлений'}
          </span>
        </div>

        <button
          type="button"
          disabled={isLocked}
          onClick={(e) => {
            e.stopPropagation();
            handleToggleShowDay();
          }}
          className={`w-10 h-6 rounded-full transition-colors p-0.5 flex items-center shrink-0 cursor-pointer ${
            ration.is_show_day ? 'bg-rose-600 justify-end' : 'bg-slate-300 justify-start'
          }`}
          aria-label="Переключить режим дня шоу"
        >
          <div className="w-5 h-5 rounded-full bg-white shadow-xs" />
        </button>
      </div>

      {/* THREE COMPACT FEEDING POSITIONS WITH FIXED HEIGHT h-[58px] */}
      <div className="space-y-2.5">
        
        {/* 1. 🥣 УТРЕННЯЯ КАША — 07:00 */}
        <div
          className={`h-[58px] px-3.5 rounded-[18px] border flex items-center justify-between transition-all ${
            ration.is_show_day
              ? 'opacity-60 bg-slate-50/80 border-slate-200/70'
              : 'bg-white/70 backdrop-blur-xl border-white/80 shadow-[0_2px_8px_rgba(15,23,42,0.03)]'
          }`}
        >
          {/* Слева: иконка + название + время жирным + серая кнопка рецепта */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 ${
              ration.is_show_day ? 'bg-slate-200/70 text-slate-400' : 'bg-amber-500/10 border border-amber-500/20'
            }`}>
              🥣
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className={`text-xs sm:text-sm font-extrabold tracking-tight truncate ${
                ration.is_show_day ? 'text-slate-500 line-through' : 'text-slate-800'
              }`}>
                Утренняя каша
              </span>
              <span className="text-xs font-black text-slate-500 shrink-0">
                07:00
              </span>
              <button
                type="button"
                onClick={() => setIsRecipeOpen(true)}
                className="h-7 px-2 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-600 border border-slate-200/60 text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                title="Технологическая карта запарки"
              >
                <BookOpen size={12} className="text-slate-500" />
                <span>Рецепт</span>
              </button>
            </div>
          </div>

          {/* Справа: строго фиксированная зона действия */}
          <div className="shrink-0 flex justify-end">
            {ration.is_show_day ? (
              <span className="h-9 px-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-[11px] font-extrabold flex items-center justify-center gap-1 whitespace-nowrap">
                <span className="leading-none">🚫</span>
                <span>Отменена<span className="hidden sm:inline"> в день шоу</span></span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleToggleMorning}
                disabled={isLocked}
                className={`min-h-[44px] h-9 px-3.5 sm:px-4 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation whitespace-nowrap ${
                  isMorningFed
                    ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/70'
                }`}
              >
                {isMorningFed ? (
                  <>
                    <Check size={14} className="text-emerald-600 stroke-[3]" />
                    <span>Выдано ✓</span>
                  </>
                ) : (
                  <span>Отметить</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 2. 🥣 ДНЕВНАЯ КАША — ПОСЛЕ РЕПЕТИЦИИ */}
        <div
          className={`h-[58px] px-3.5 rounded-[18px] border flex items-center justify-between transition-all ${
            ration.is_show_day
              ? 'opacity-60 bg-slate-50/80 border-slate-200/70'
              : 'bg-white/70 backdrop-blur-xl border-white/80 shadow-[0_2px_8px_rgba(15,23,42,0.03)]'
          }`}
        >
          {/* Слева: иконка + название + время жирным + серая кнопка рецепта */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 ${
              ration.is_show_day ? 'bg-slate-200/70 text-slate-400' : 'bg-amber-500/10 border border-amber-500/20'
            }`}>
              🥣
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className={`text-xs sm:text-sm font-extrabold tracking-tight truncate ${
                ration.is_show_day ? 'text-slate-500 line-through' : 'text-slate-800'
              }`}>
                Дневная каша
              </span>
              <span className="text-xs font-black text-slate-500 shrink-0">
                Обед
              </span>
              <button
                type="button"
                onClick={() => setIsRecipeOpen(true)}
                className="h-7 px-2 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-600 border border-slate-200/60 text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                title="Технологическая карта запарки"
              >
                <BookOpen size={12} className="text-slate-500" />
                <span>Рецепт</span>
              </button>
            </div>
          </div>

          {/* Справа: строго фиксированная зона действия */}
          <div className="shrink-0 flex justify-end">
            {ration.is_show_day ? (
              <span className="h-9 px-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-800 text-[11px] font-extrabold flex items-center justify-center gap-1 whitespace-nowrap">
                <span className="leading-none">🚫</span>
                <span>Отменена<span className="hidden sm:inline"> в день шоу</span></span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleNoonAction}
                disabled={isLocked}
                className={`min-h-[44px] h-9 px-3.5 sm:px-4 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation whitespace-nowrap ${
                  isNoonFed
                    ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/70'
                }`}
              >
                {isNoonFed ? (
                  <>
                    <Check size={14} className="text-emerald-600 stroke-[3]" />
                    <span>Выдано ✓</span>
                  </>
                ) : (
                  <span>Отметить</span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* 3. 🥗 ВЕЧЕРНИЙ РАЦИОН — 19:00 (ОСТАЕТСЯ ДОСТУПНЫМ В ДЕНЬ ШОУ) */}
        <div className="h-[58px] px-3.5 rounded-[18px] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_2px_8px_rgba(15,23,42,0.03)] flex items-center justify-between transition-all">
          {/* Слева: иконка + название + время жирным + серая кнопка состава */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-xl bg-lime-500/10 border border-lime-500/20 flex items-center justify-center text-base shrink-0">
              🥗
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-tight truncate">
                Вечерний рацион
              </span>
              <span className="text-xs font-black text-slate-500 shrink-0">
                19:00
              </span>
              <button
                type="button"
                onClick={() => setIsSaladTechOpen(true)}
                className="h-7 px-2 rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-600 border border-slate-200/60 text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shrink-0"
                title="Технологическая карта вечернего салата"
              >
                <BookOpen size={12} className="text-slate-500" />
                <span>Состав</span>
              </button>
            </div>
          </div>

          {/* Справа: строго фиксированная зона действия */}
          <div className="shrink-0 flex justify-end">
            <button
              type="button"
              onClick={handleToggleEvening}
              disabled={isLocked}
              className={`min-h-[44px] h-9 px-3.5 sm:px-4 rounded-xl text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer touch-manipulation whitespace-nowrap ${
                isEveningFed
                  ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/70'
              }`}
            >
              {isEveningFed ? (
                <>
                  <Check size={14} className="text-emerald-600 stroke-[3]" />
                  <span>Выдано ✓</span>
                </>
              ) : (
                <span>Отметить</span>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* COOLDOWN CONFIRMATION MODAL (Тайм-аут остывания 45-60 мин) */}
      {isCooldownModalOpen && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsCooldownModalOpen(false)}
        >
          <div 
            className="w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-white/80 rounded-[24px] p-5 shadow-2xl animate-in zoom-in-95 duration-200 space-y-3.5"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 shrink-0">
                  <AlertTriangle size={20} className="stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-tight leading-tight">
                    Контроль остывания
                  </h3>
                  <div className="text-[11px] font-bold text-amber-800">
                    Ветеринарный протокол (45–60 мин)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCooldownModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition active:scale-95 cursor-pointer shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {/* Checklist items */}
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-3.5 space-y-2">
              <div className="text-xs font-extrabold text-amber-950">
                Слон зашел с манежа? Убедитесь, что:
              </div>
              <ol className="text-xs text-amber-900/95 space-y-1.5 list-decimal list-inside font-semibold leading-relaxed">
                <li>
                  Прошло <strong>не менее 45 минут</strong> после работы.
                </li>
                <li>
                  Дыхание спокойное (<strong>норма ЧСС 25–35 уд/мин</strong>).
                </li>
                <li>
                  Слон пожевал <strong>сено</strong> и попил воды.
                </li>
              </ol>
              <div className="text-[11px] text-rose-700 font-extrabold pt-2 border-t border-amber-500/20 flex items-start gap-1.5">
                <span className="text-xs leading-none">⚠️</span>
                <span>Кормление горячего слона провоцирует брожение и колики!</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsCooldownModalOpen(false)}
                className="h-11 min-h-[44px] px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition active:scale-95 cursor-pointer touch-manipulation text-center flex items-center justify-center whitespace-nowrap"
              >
                Подождать еще
              </button>
              <button
                type="button"
                onClick={handleConfirmNoonMash}
                className="h-11 min-h-[44px] px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition active:scale-95 cursor-pointer touch-manipulation shadow-xs text-center flex items-center justify-center gap-1 whitespace-nowrap"
              >
                <Check size={16} className="stroke-[3] shrink-0" />
                <span>Подтверждаю, остыл</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* RECIPE BOTTOM SHEET */}
      <RecipeBottomSheet
        isOpen={isRecipeOpen}
        onClose={() => setIsRecipeOpen(false)}
      />

      {/* SALAD TECH REGULATION MODAL */}
      <SaladTechModal
        isOpen={isSaladTechOpen}
        onClose={() => setIsSaladTechOpen(false)}
      />
    </div>
  );
}
