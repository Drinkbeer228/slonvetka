import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Clock3,
  Drumstick,
  Pill,
  Plus,
  Share2,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import { useStore } from '../store';
import { shiftService } from '../services/shiftService';
import { DailyRationData } from './daily-shift/FeedControl';
import { Elephant } from '../types';
import { DailyShift, ElephantDailyMetrics, ShiftPhoto } from '../types/shift';

export type DefecationQuality = 'NORMAL' | 'UNDIGESTED_GRAIN' | 'DIARRHEA' | 'MUCUS' | 'DRY';

export interface DefecationLogEntry {
  id: string;
  timestamp: string;
  quality: DefecationQuality;
  note?: string;
}

export interface DietOverride {
  active: boolean;
  oatsAdjustKg?: number;
  additions?: string;
  noteToKeepers?: string;
}

export interface VetDashboardState {
  elephantName: string;
  weightKg: number;
  giRiskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  defecationLogs: DefecationLogEntry[];
  dietOverride: DietOverride;
}

export type VetKeeperViewValue = 'daily_shift' | 'vet_cabinet' | 'vet_dashboard';

interface VetKeeperViewToggleProps {
  value: VetKeeperViewValue;
  onChange: (value: 'daily_shift' | 'vet_cabinet') => void;
  className?: string;
}

interface ParsedFeedNotes extends DailyRationData {
  diet_override?: DietOverride;
}

interface VetCabinetDashboardProps {
  onNavigate?: (screen: string) => void;
}

const DEFAULT_DIET_OVERRIDE: DietOverride = { active: false };
const SHIFT_START_MINUTES = 7 * 60;
const SHIFT_END_MINUTES = 22 * 60;
const DEMO_WEIGHTS: Record<string, number> = {
  margo: 4120,
  odri: 3980,
  pretty: 4210,
};

const CARD_CLASS = 'bg-white/80 backdrop-blur-xl border border-white/60 rounded-3xl p-5 shadow-lg';

export function VetKeeperViewToggle({ value, onChange, className = '' }: VetKeeperViewToggleProps) {
  const isKeeperView = value === 'daily_shift';

  return (
    <div
      className={`inline-flex min-h-[44px] items-center rounded-2xl border border-white/60 bg-white/70 p-1 shadow-sm backdrop-blur-xl ${className}`.trim()}
      role="tablist"
      aria-label="Переключатель вида"
    >
      <button
        type="button"
        role="tab"
        aria-selected={isKeeperView}
        onClick={() => onChange('daily_shift')}
        className={`rounded-xl px-3 py-2 text-xs font-extrabold transition-all sm:px-4 ${
          isKeeperView ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        🐘 Слоновник
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={!isKeeperView}
        onClick={() => onChange('vet_cabinet')}
        className={`rounded-xl px-3 py-2 text-xs font-extrabold transition-all sm:px-4 ${
          !isKeeperView ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        🩺 Веткабинет
      </button>
    </div>
  );
}

export function computeGiRisk(
  logs: DefecationLogEntry[],
  refusedFood: boolean
): { level: VetDashboardState['giRiskLevel']; reasons: string[] } {
  if (logs.length === 0) {
    return {
      level: 'HIGH',
      reasons: ['За смену не зафиксировано ни одной дефекации в интервале 07:00–22:00.'],
    };
  }

  const sortedLogs = [...logs].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  const intervals = sortedLogs.slice(1).map((log, index) => {
    return (new Date(log.timestamp).getTime() - new Date(sortedLogs[index].timestamp).getTime()) / 36e5;
  });

  const maxGap = intervals.length > 0 ? Math.max(...intervals) : 0;
  const undigestedCount = sortedLogs.filter(log => log.quality === 'UNDIGESTED_GRAIN').length;
  const hasDiarrheaOrMucus = sortedLogs.some(log => log.quality === 'DIARRHEA' || log.quality === 'MUCUS');
  const allNormal = sortedLogs.every(log => log.quality === 'NORMAL');
  const stableRhythm = intervals.length === 0 || intervals.every(interval => interval >= 1.5 && interval <= 2.5);

  if (maxGap > 4.5 || (hasDiarrheaOrMucus && refusedFood)) {
    const reasons: string[] = [];
    if (maxGap > 4.5) {
      reasons.push(`Пауза между дефекациями достигла ${maxGap.toFixed(1)} ч.`);
    }
    if (hasDiarrheaOrMucus && refusedFood) {
      reasons.push('Есть понос/слизь на фоне отказа от корма.');
    }
    return { level: 'HIGH', reasons };
  }

  if (maxGap > 3.5 || undigestedCount > 2) {
    const reasons: string[] = [];
    if (maxGap > 3.5) {
      reasons.push(`Пауза между дефекациями достигла ${maxGap.toFixed(1)} ч.`);
    }
    if (undigestedCount > 2) {
      reasons.push(`Непереваренное зерно отмечено ${undigestedCount} раз.`);
    }
    return { level: 'MEDIUM', reasons };
  }

  if (stableRhythm && allNormal) {
    return {
      level: 'LOW',
      reasons: ['Ритм дефекации стабилен: интервалы держатся в пределах 1.5–2.5 ч, консистенция без отклонений.'],
    };
  }

  return {
    level: 'LOW',
    reasons: ['Критических GI-триггеров не выявлено, продолжайте обычное наблюдение.'],
  };
}

const safeParseFeedNotesObject = (feedNotes?: string | null): Record<string, unknown> => {
  if (!feedNotes) return {};
  try {
    const parsed = JSON.parse(feedNotes);
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
};

const parseFeedNotes = (feedNotes?: string | null): ParsedFeedNotes => {
  if (!feedNotes) {
    return {
      morning_porridge: 'none',
      evening_salad_chips: [],
      salad_notes: '',
      salad_appetite: null,
      diet_override: DEFAULT_DIET_OVERRIDE,
    };
  }

  try {
    const parsed = JSON.parse(feedNotes) as ParsedFeedNotes;
    return {
      morning_porridge: parsed.morning_porridge ?? 'none',
      evening_salad_chips: Array.isArray(parsed.evening_salad_chips) ? parsed.evening_salad_chips : [],
      salad_notes: parsed.salad_notes ?? '',
      coarse_branches: parsed.coarse_branches ?? 0,
      salad_base_included: Boolean(parsed.salad_base_included ?? parsed.evening_diet_fed),
      salad_appetite: parsed.salad_appetite ?? null,
      salad_base_time: parsed.salad_base_time ?? parsed.evening_diet_time ?? null,
      morning_mash_fed: Boolean(parsed.morning_mash_fed ?? (parsed.morning_porridge && parsed.morning_porridge !== 'none')),
      morning_mash_time: parsed.morning_mash_time ?? parsed.morning_porridge_time ?? null,
      is_show_day: Boolean(parsed.is_show_day),
      noon_mash_status: parsed.noon_mash_status ?? 'pending',
      noon_mash_cooldown_confirmed: Boolean(parsed.noon_mash_cooldown_confirmed),
      noon_mash_time: parsed.noon_mash_time ?? null,
      evening_diet_fed: Boolean(parsed.evening_diet_fed ?? parsed.salad_base_included),
      evening_diet_time: parsed.evening_diet_time ?? parsed.salad_base_time ?? null,
      diet_override: parsed.diet_override?.active
        ? { ...parsed.diet_override, active: true }
        : { active: false, ...parsed.diet_override },
    };
  } catch {
    return {
      morning_porridge: 'none',
      evening_salad_chips: [],
      salad_notes: feedNotes,
      salad_appetite: null,
      diet_override: DEFAULT_DIET_OVERRIDE,
    };
  }
};

const getElephantWeight = (elephant: Elephant): number => {
  return DEMO_WEIGHTS[elephant.id] ?? 4000;
};

const normalizeText = (value: string) => value.toLowerCase().replace(/ё/g, 'е');

const mapTraitToQuality = (trait?: string): DefecationQuality => {
  const value = normalizeText(trait ?? '');
  if (value.includes('жидк') || value.includes('понос')) return 'DIARRHEA';
  if (value.includes('слиз')) return 'MUCUS';
  if (value.includes('зерн') || value.includes('овес') || value.includes('неперевар')) return 'UNDIGESTED_GRAIN';
  if (value.includes('сух') || value.includes('тверд')) return 'DRY';
  return 'NORMAL';
};

const qualityLabelMap: Record<DefecationQuality, string> = {
  NORMAL: 'Норма',
  UNDIGESTED_GRAIN: 'Непереваренное зерно',
  DIARRHEA: 'Понос',
  MUCUS: 'Слизь',
  DRY: 'Сухой стул',
};

const qualityClassMap: Record<DefecationQuality, string> = {
  NORMAL: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  UNDIGESTED_GRAIN: 'bg-amber-100 text-amber-900 border-amber-200',
  DIARRHEA: 'bg-rose-100 text-rose-900 border-rose-200',
  MUCUS: 'bg-fuchsia-100 text-fuchsia-900 border-fuchsia-200',
  DRY: 'bg-slate-200 text-slate-800 border-slate-300',
};

const qualityDotMap: Record<DefecationQuality, string> = {
  NORMAL: 'bg-emerald-500',
  UNDIGESTED_GRAIN: 'bg-amber-500',
  DIARRHEA: 'bg-rose-500',
  MUCUS: 'bg-fuchsia-500',
  DRY: 'bg-slate-500',
};

const riskToneMap: Record<VetDashboardState['giRiskLevel'], string> = {
  LOW: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  MEDIUM: 'bg-amber-100 text-amber-950 border-amber-200',
  HIGH: 'bg-rose-100 text-rose-950 border-rose-200',
};

const riskLabelMap: Record<VetDashboardState['giRiskLevel'], string> = {
  LOW: '🟢 Стабильно / Низкий',
  MEDIUM: '🟡 Внимание / Повышенный',
  HIGH: '🔴 Критический / Угроза колик',
};

const toShiftDate = (selectedDate: string, hours: number, minutes: number) => {
  return new Date(`${selectedDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
};

const parsePhotoTimestamp = (selectedDate: string, timestamp?: string) => {
  if (!timestamp) return null;
  const direct = new Date(timestamp);
  if (!Number.isNaN(direct.getTime())) return direct;
  if (/^\d{2}:\d{2}/.test(timestamp)) {
    const [hours, minutes] = timestamp.slice(0, 5).split(':').map(Number);
    return toShiftDate(selectedDate, hours, minutes);
  }
  return null;
};

const buildSyntheticTimestamps = (selectedDate: string, count: number): string[] => {
  if (count <= 0) return [];
  const span = SHIFT_END_MINUTES - SHIFT_START_MINUTES;
  const step = span / (count + 1);

  return Array.from({ length: count }, (_, index) => {
    const totalMinutes = SHIFT_START_MINUTES + step * (index + 1);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return toShiftDate(selectedDate, hours, minutes).toISOString();
  });
};

const buildDefecationLogs = (
  elephant: Elephant,
  metric: ElephantDailyMetrics | undefined,
  selectedDate: string
): DefecationLogEntry[] => {
  const poopCount = Math.max(metric?.poop_count ?? 0, 0);
  if (!poopCount) return [];

  const stoolPhotos = (metric?.photos ?? [])
    .filter((photo: ShiftPhoto) => photo.section === 'stool')
    .map(photo => parsePhotoTimestamp(selectedDate, photo.timestamp))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime());

  const mappedTraits = (metric?.feces_traits ?? []).map(trait => ({
    trait,
    quality: mapTraitToQuality(trait),
  }));
  const syntheticTimestamps = buildSyntheticTimestamps(selectedDate, poopCount);

  const logs = Array.from({ length: poopCount }, (_, index) => {
    const traitInfo = mappedTraits[index] ?? mappedTraits[mappedTraits.length - 1];
    const timestamp = stoolPhotos[index]?.toISOString() ?? syntheticTimestamps[index];
    return {
      id: `${elephant.id}-${selectedDate}-${index}`,
      timestamp,
      quality: traitInfo?.quality ?? 'NORMAL',
      note: traitInfo?.trait,
    } satisfies DefecationLogEntry;
  });

  return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

const formatClock = (timestamp: string) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
};

const getIntervals = (logs: DefecationLogEntry[]) => {
  return logs.slice(1).map((log, index) => {
    const previous = logs[index];
    return {
      id: `${previous.id}-${log.id}`,
      hours: (new Date(log.timestamp).getTime() - new Date(previous.timestamp).getTime()) / 36e5,
      from: previous.timestamp,
      to: log.timestamp,
    };
  });
};

const buildEpicrisisText = (
  state: VetDashboardState,
  reasons: string[],
  selectedDate: string,
  refusedFood: boolean
) => {
  const logsText = state.defecationLogs.length > 0
    ? state.defecationLogs.map(log => `${formatClock(log.timestamp)} — ${qualityLabelMap[log.quality]}`).join('\n')
    : 'Дефекации не отмечены';

  return [
    `Эпикриз на ${selectedDate}`,
    `${state.elephantName}, вес ${state.weightKg} кг`,
    `GI Risk: ${riskLabelMap[state.giRiskLevel]}`,
    `Отказ от корма: ${refusedFood ? 'да' : 'нет'}`,
    'Причины:',
    ...reasons.map(reason => `• ${reason}`),
    'Хронология дефекации:',
    logsText,
  ].join('\n');
};

export function VetCabinetDashboard({ onNavigate }: VetCabinetDashboardProps) {
  const { elephants, selectedDate } = useStore();
  const [shift, setShift] = useState<DailyShift | null>(null);
  const [metricsMap, setMetricsMap] = useState<Record<string, ElephantDailyMetrics>>({});
  const [dietOverride, setDietOverride] = useState<DietOverride>(DEFAULT_DIET_OVERRIDE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string>('');

  const loadShift = useCallback(async () => {
    setLoading(true);
    try {
      const data = await shiftService.getShiftData(selectedDate);
      setShift(data.shift);
      setMetricsMap(data.metrics || {});
    } catch (error) {
      console.error('Не удалось загрузить данные веткабинета:', error);
      setShift(null);
      setMetricsMap({});
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    loadShift();
  }, [loadShift]);

  const rationData = useMemo(() => parseFeedNotes(shift?.feed_notes), [shift?.feed_notes]);
  const refusedFood = rationData.salad_appetite === 'refused';

  useEffect(() => {
    setDietOverride(rationData.diet_override?.active ? rationData.diet_override : { active: false, ...rationData.diet_override });
  }, [rationData]);

  const dashboardStates = useMemo(() => {
    return elephants.map(elephant => {
      const defecationLogs = buildDefecationLogs(elephant, metricsMap[elephant.id], selectedDate);
      const risk = computeGiRisk(defecationLogs, refusedFood);
      return {
        elephant,
        state: {
          elephantName: elephant.name,
          weightKg: getElephantWeight(elephant),
          giRiskLevel: risk.level,
          defecationLogs,
          dietOverride,
        } satisfies VetDashboardState,
        riskReasons: risk.reasons,
        metric: metricsMap[elephant.id],
      };
    });
  }, [dietOverride, elephants, metricsMap, refusedFood, selectedDate]);

  const handleDietOverrideSave = useCallback(async () => {
    if (!shift) return;
    setSaving(true);
    setFeedback('');

    try {
      const rawFeed = safeParseFeedNotesObject(shift.feed_notes);
      const normalizedOverride: DietOverride = dietOverride.active
        ? {
            active: true,
            ...(dietOverride.oatsAdjustKg != null && !Number.isNaN(dietOverride.oatsAdjustKg) ? { oatsAdjustKg: dietOverride.oatsAdjustKg } : {}),
            ...(dietOverride.additions?.trim() ? { additions: dietOverride.additions.trim() } : {}),
            ...(dietOverride.noteToKeepers?.trim() ? { noteToKeepers: dietOverride.noteToKeepers.trim() } : {}),
          }
        : { active: false };

      const updatedShift: DailyShift = {
        ...shift,
        feed_notes: JSON.stringify({
          ...rawFeed,
          diet_override: normalizedOverride,
        }),
      };

      await shiftService.saveShiftData(updatedShift, metricsMap);
      setShift(updatedShift);
      setFeedback('Назначение сохранено в кормовые заметки смены.');
    } catch (error) {
      console.error('Не удалось сохранить diet_override:', error);
      setFeedback('Не удалось сохранить назначение.');
    } finally {
      setSaving(false);
    }
  }, [dietOverride, metricsMap, shift]);

  const handleShareEpicrisis = useCallback(async (state: VetDashboardState, reasons: string[]) => {
    const text = buildEpicrisisText(state, reasons, selectedDate, refusedFood);

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({
          title: `Эпикриз — ${state.elephantName}`,
          text,
        });
        setFeedback(`Эпикриз для ${state.elephantName} отправлен.`);
        return;
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        setFeedback(`Эпикриз для ${state.elephantName} скопирован в буфер обмена.`);
        return;
      }

      setFeedback('Поделиться эпикризом не удалось: браузер не поддерживает share/clipboard.');
    } catch (error) {
      console.error('Не удалось поделиться эпикризом:', error);
      setFeedback('Не удалось сформировать эпикриз для Telegram.');
    }
  }, [refusedFood, selectedDate]);

  const cycleItems = useMemo(() => {
    const porridgeDone = Boolean(rationData.morning_mash_fed ?? (rationData.morning_porridge && rationData.morning_porridge !== 'none'));
    const manegeDone = Boolean(rationData.is_show_day || rationData.noon_mash_status === 'fed' || rationData.noon_mash_status === 'skipped_show_day');
    const saladDone = Boolean(rationData.salad_base_included || rationData.evening_diet_fed || rationData.salad_appetite);

    return [
      {
        title: 'Каша',
        icon: '🥣',
        done: porridgeDone,
        detail: porridgeDone
          ? `Выдана ${rationData.morning_mash_time || 'утром'} ✅`
          : 'Выдача не отмечена',
      },
      {
        title: 'Манеж / репетиция',
        icon: '🎪',
        done: manegeDone,
        detail: rationData.is_show_day
          ? 'День шоу ✅'
          : rationData.noon_mash_cooldown_confirmed
            ? 'Остывание выдержано ✅'
            : manegeDone
              ? 'Цикл отмечен ✅'
              : 'Нет отметки по циклу',
      },
      {
        title: 'Салат',
        icon: '🥗',
        done: saladDone,
        detail: rationData.salad_appetite === 'refused'
          ? 'Отказ от салата ⚠️'
          : rationData.salad_appetite === 'partial'
            ? 'Съедено частично ✅'
            : saladDone
              ? 'База и выдача отмечены ✅'
              : 'Выдача не отмечена',
      },
    ];
  }, [rationData]);

  if (loading) {
    return <div className="px-3 py-6 text-sm font-semibold text-slate-600 sm:px-6">Загружаю данные веткабинета…</div>;
  }

  if (elephants.length === 0) {
    return <div className="px-3 py-6 text-sm font-semibold text-slate-600 sm:px-6">Нет доступных карточек слонов.</div>;
  }

  return (
    <div className="space-y-5 px-3 py-5 sm:px-6">
      <section className={CARD_CLASS}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-700">Веткабинет</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">GI-мониторинг и назначения на {selectedDate}</h1>
            <p className="mt-1 text-sm text-slate-600">Данные тянутся из `shiftService.getShiftData`, назначения сохраняются в `feed_notes.diet_override`.</p>
          </div>
          {feedback && (
            <div className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-900">
              {feedback}
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardStates.map(({ elephant, state, riskReasons }) => (
          <article key={elephant.id} className={CARD_CLASS}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">Пациент</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">{state.elephantName}</h2>
                <p className="mt-1 text-sm text-slate-600">🐘 {state.weightKg} кг</p>
              </div>
              <span className={`rounded-2xl border px-3 py-2 text-xs font-black ${riskToneMap[state.giRiskLevel]}`}>
                {riskLabelMap[state.giRiskLevel]}
              </span>
            </div>

            <ul className="mt-4 space-y-2 text-sm text-slate-700">
              {riskReasons.map(reason => (
                <li key={reason} className="flex gap-2">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onNavigate?.('vet_dashboard')}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Plus size={16} />
                Вет-процедура
              </button>
              <button
                type="button"
                onClick={() => handleShareEpicrisis(state, riskReasons)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-50"
              >
                <Share2 size={16} />
                Эпикриз для Telegram
              </button>
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardStates.map(({ elephant, state }) => {
          const intervals = getIntervals(state.defecationLogs);
          return (
            <article key={`${elephant.id}-timeline`} className={`${CARD_CLASS} space-y-5`}>
              <div>
                <h3 className="text-lg font-black text-slate-950">Хроника ЖКТ — {state.elephantName}</h3>
                <p className="text-sm text-slate-600">Таймлайн дефекации и интервалы внутри смены 07:00–22:00.</p>
              </div>

              <div className="space-y-3">
                {state.defecationLogs.length === 0 ? (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">
                    Дефекации за дату не зарегистрированы.
                  </div>
                ) : (
                  state.defecationLogs.map((log, index) => {
                    const nextInterval = intervals[index];
                    return (
                      <div key={log.id} className="relative pl-5">
                        <span className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${qualityDotMap[log.quality]}`} />
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-slate-900">{formatClock(log.timestamp)} — {qualityLabelMap[log.quality]}</p>
                            {log.note && <p className="text-xs text-slate-500">{log.note}</p>}
                          </div>
                          <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${qualityClassMap[log.quality]}`}>
                            {qualityLabelMap[log.quality]}
                          </span>
                        </div>
                        {nextInterval && (
                          <p className={`mt-2 text-xs font-bold ${nextInterval.hours > 3.5 ? 'text-amber-700' : 'text-slate-500'}`}>
                            Пауза до следующей кучи: {nextInterval.hours.toFixed(1)} ч
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <div>
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp size={16} className="text-sky-700" />
                  <h4 className="text-sm font-black text-slate-900">Мини-гистограмма частоты</h4>
                </div>
                <div className="space-y-2">
                  {intervals.length === 0 ? (
                    <p className="text-sm text-slate-500">Недостаточно точек для сравнения с нормой 1.5–2.5 ч.</p>
                  ) : (
                    intervals.map(interval => {
                      const inRange = interval.hours >= 1.5 && interval.hours <= 2.5;
                      return (
                        <div key={interval.id}>
                          <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-600">
                            <span>{formatClock(interval.from)} → {formatClock(interval.to)}</span>
                            <span>{interval.hours.toFixed(1)} ч</span>
                          </div>
                          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${inRange ? 'bg-emerald-500' : interval.hours > 3.5 ? 'bg-amber-500' : 'bg-sky-500'}`}
                              style={{ width: `${Math.max(18, Math.min(interval.hours / 5, 1) * 100)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className={`${CARD_CLASS} xl:col-span-1`}>
          <div className="flex items-center gap-2">
            <Pill size={18} className="text-sky-700" />
            <h3 className="text-lg font-black text-slate-950">Назначение по рациону</h3>
          </div>
          <div className="mt-4 space-y-4">
            <label className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
              <span className="text-sm font-bold text-slate-900">Коррекция рациона активна</span>
              <button
                type="button"
                aria-pressed={dietOverride.active}
                onClick={() => setDietOverride(prev => ({ ...prev, active: !prev.active }))}
                className={`flex h-7 w-12 items-center rounded-full p-1 transition ${dietOverride.active ? 'justify-end bg-sky-600' : 'justify-start bg-slate-300'}`}
              >
                <span className="h-5 w-5 rounded-full bg-white shadow" />
              </button>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">Уменьшить овёс до X кг</span>
              <input
                type="number"
                min="0"
                step="0.1"
                value={dietOverride.oatsAdjustKg ?? ''}
                onChange={event => setDietOverride(prev => ({
                  ...prev,
                  oatsAdjustKg: event.target.value === '' ? undefined : Number(event.target.value),
                }))}
                className="min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 outline-none ring-0 transition focus:border-sky-300"
                placeholder="Например, 4.5"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">Добавки</span>
              <input
                type="text"
                value={dietOverride.additions ?? ''}
                onChange={event => setDietOverride(prev => ({ ...prev, additions: event.target.value }))}
                className="min-h-[44px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-300"
                placeholder="Отвар льна 2 л / порошок 50 г"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-bold text-slate-700">Заметка киперу</span>
              <textarea
                value={dietOverride.noteToKeepers ?? ''}
                onChange={event => setDietOverride(prev => ({ ...prev, noteToKeepers: event.target.value }))}
                className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-300"
                placeholder="Не давать яблоки 2 дня из-за брожения"
              />
            </label>

            {dietOverride.active && (
              <div className="rounded-2xl border border-sky-300 bg-sky-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-sky-600/20">
                ⚠️ Назначение врача на сегодня!
                <div className="mt-1 text-xs font-semibold text-sky-50">
                  {dietOverride.noteToKeepers?.trim() || 'Кипер увидит активную врачебную коррекцию рациона.'}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleDietOverrideSave}
              disabled={saving || !shift}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-2xl bg-sky-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Clipboard size={16} />
              {saving ? 'Сохраняю…' : 'Сохранить назначение'}
            </button>
          </div>
        </article>

        <article className={CARD_CLASS}>
          <div className="flex items-center gap-2">
            <Clock3 size={18} className="text-sky-700" />
            <h3 className="text-lg font-black text-slate-950">Контроль суточных циклов</h3>
          </div>
          <div className="mt-4 space-y-3">
            {cycleItems.map(item => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-900">{item.icon} {item.title}</p>
                    <p className="mt-1 text-xs font-semibold text-slate-600">{item.detail}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-black ${item.done ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-100 text-slate-500'}`}>
                    <CheckCircle2 size={14} />
                    {item.done ? 'OK' : 'Нет'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className={CARD_CLASS}>
          <div className="flex items-center gap-2">
            <Stethoscope size={18} className="text-sky-700" />
            <h3 className="text-lg font-black text-slate-950">Клинический календарь</h3>
          </div>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
              <p className="text-sm font-black text-slate-900">Подиатрия</p>
              <p className="mt-1 text-xs font-semibold text-slate-600">Через 5 дней</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
              <p className="text-sm font-black text-slate-900">ПЦР EEHV</p>
              <p className="mt-1 text-xs font-semibold text-slate-600">Сдан 01.09, отрицательно</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
              <p className="text-sm font-black text-slate-900">Контрольное взвешивание</p>
              <p className="mt-1 text-xs font-semibold text-slate-600">+35 кг за месяц</p>
            </div>
          </div>
        </article>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {dashboardStates.map(({ elephant, metric }) => (
          <article key={`${elephant.id}-summary`} className={CARD_CLASS}>
            <div className="flex items-center gap-2">
              <Drumstick size={18} className="text-sky-700" />
              <h3 className="text-lg font-black text-slate-950">Сводка наблюдений — {elephant.name}</h3>
            </div>
            <div className="mt-4 space-y-3 text-sm font-semibold text-slate-700">
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                <span>Количество куч</span>
                <span className="font-black text-slate-950">{metric?.poop_count ?? 0}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                <span>Теги стула</span>
                <span className="max-w-[60%] text-right text-xs font-bold text-slate-500">{metric?.feces_traits?.join(', ') || 'Нет данных'}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
                <span>Заметки</span>
                <span className="max-w-[60%] text-right text-xs font-bold text-slate-500">{metric?.notes?.trim() || 'Без заметок'}</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
