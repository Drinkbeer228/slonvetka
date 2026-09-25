import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { Profile, Elephant, Assignment, FodderItem } from '../types';
import { cacheElephants, cacheAssignments, getCachedElephants, getCachedAssignments } from '../services/offlineDb';
import { canManageUsers } from '../lib/permissions';

interface StoreState {
  profile: Profile | null;
  isAdmin: boolean;
  elephants: Elephant[];
  assignments: Assignment[];
  loading: boolean;
  selectedDate: string;
  activeElephantId: string;
  globalSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
  fodderInventory: FodderItem[];
}

interface StoreContextType extends StoreState {
  setProfile: (profile: Profile | null) => void;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAssignments: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  setActiveElephantId: (id: string) => void;
  setGlobalSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  updateFodderAmount: (id: string, delta: number) => void;
  deductFodderKg: (id: string, kg: number) => void;
  addFodderItem: (item: FodderItem) => void;
  deleteFodderItem: (id: string) => void;
  editFodderItem: (id: string, updates: Partial<FodderItem>) => void;
}

export const DEFAULT_ELEPHANTS: Elephant[] = [
  { id: 'margo', name: 'Марго', created_at: new Date().toISOString() },
  { id: 'audrey', name: 'Одри', created_at: new Date().toISOString() },
  { id: 'pretty', name: 'Прэтти', created_at: new Date().toISOString() }
];

const INITIAL_FODDER_INVENTORY: FodderItem[] = [
  { id: 'h1', parentId: 'bales', name: 'Тимофеевка', scoreTag: '👑 10/10', amount: 10, category: 'rough', unit: 'шт', isDefault: true },
  { id: 'h2', parentId: 'bales', name: 'Луговое разнотравье', scoreTag: '🌾 9/10', amount: 15, category: 'rough', unit: 'шт', isDefault: true },
  { id: 'h3', parentId: 'bales', name: 'Костёр', scoreTag: '🌿 8/10', amount: 5, category: 'rough', unit: 'шт', isDefault: true },
  { id: 'h4', parentId: 'bales', name: 'Овсяница / злаки', scoreTag: '🌾 8/10', amount: 5, category: 'rough', unit: 'шт', isDefault: true },
  { id: 'h5', parentId: 'bales', name: 'Люцерна', scoreTag: '⚠️ 6/10', amount: 2, category: 'rough', unit: 'шт', isDefault: true },
  { id: 'h6', parentId: 'bales', name: 'Солома овсяная', scoreTag: '🪵 6/10', amount: 5, category: 'rough', unit: 'шт', isDefault: true },

  { id: 'r1', parentId: 'rolls', name: 'Тимофеевка', scoreTag: '👑 10/10', amount: 2, category: 'rough', unit: 'рул', isDefault: true },
  { id: 'r2', parentId: 'rolls', name: 'Луговое разнотравье', scoreTag: '🌾 9/10', amount: 3, category: 'rough', unit: 'рул', isDefault: true },
  { id: 'r3', parentId: 'rolls', name: 'Костёр', scoreTag: '🌿 8/10', amount: 1, category: 'rough', unit: 'рул', isDefault: true },
  { id: 'r4', parentId: 'rolls', name: 'Овсяница / злаки', scoreTag: '🌾 8/10', amount: 0, category: 'rough', unit: 'рул', isDefault: true },
  { id: 'r5', parentId: 'rolls', name: 'Люцерна', scoreTag: '⚠️ 6/10', amount: 1, category: 'rough', unit: 'рул', isDefault: true },
  { id: 'r6', parentId: 'rolls', name: 'Солома овсяная', scoreTag: '🪵 6/10', amount: 1, category: 'rough', unit: 'рул', isDefault: true },

  { id: 'b1', parentId: 'browse', name: 'Ива / Ветла', scoreTag: '👑 10/10', amount: 5, category: 'rough', unit: 'шт', isDefault: true },
  { id: 'b2', parentId: 'browse', name: 'Бамбук', scoreTag: '🎋 9/10', amount: 2, category: 'rough', unit: 'шт', isDefault: true },
  { id: 'b3', parentId: 'browse', name: 'Хвоя / Лапник', scoreTag: '🌲 8/10', amount: 3, category: 'rough', unit: 'шт', isDefault: true },
  { id: 'b4', parentId: 'browse', name: 'Брёвна / Кряжи', scoreTag: '🪵 8/10', amount: 2, category: 'rough', unit: 'шт', isDefault: true },
  { id: 'b5', parentId: 'browse', name: 'Веники банные', scoreTag: '🍃 7/10', amount: 3, category: 'rough', unit: 'шт', isDefault: true },

  { id: 'c1', parentId: 'concentrate', name: 'Овёс (мешки)', amount: 20, fullBagsCount: 19, currentBagKg: 20, bagCapacityKg: 30, category: 'concentrate', unit: 'меш', isDefault: true },
  { id: 'c2', parentId: 'concentrate', name: 'Отруби пшеничные (мешки)', amount: 12, fullBagsCount: 11, currentBagKg: 15, bagCapacityKg: 25, category: 'concentrate', unit: 'меш', isDefault: true },
  { id: 'c3', parentId: 'concentrate', name: 'ВТМ гранулы (мешки)', amount: 10, fullBagsCount: 9, currentBagKg: 25, bagCapacityKg: 30, category: 'concentrate', unit: 'меш', isDefault: true },
  { id: 'c4', parentId: 'concentrate', name: 'Льняной жмых (мешки)', amount: 8, fullBagsCount: 7, currentBagKg: 18, bagCapacityKg: 25, category: 'concentrate', unit: 'меш', isDefault: true },
  { id: 'c5', parentId: 'concentrate', name: 'Ячмень плющеный (мешки)', amount: 8, fullBagsCount: 7, currentBagKg: 28, bagCapacityKg: 35, category: 'concentrate', unit: 'меш', isDefault: true },
  { id: 'c6', parentId: 'concentrate', name: 'Свекловичный жом (мешки)', amount: 6, fullBagsCount: 5, currentBagKg: 22, bagCapacityKg: 30, category: 'concentrate', unit: 'меш', isDefault: true },
  { id: 'c11', parentId: 'concentrate', name: 'Геркулес хлопья (мешки)', amount: 10, fullBagsCount: 9, currentBagKg: 22, bagCapacityKg: 25, category: 'concentrate', unit: 'меш', isDefault: true },
  { id: 'c12', parentId: 'concentrate', name: 'Гречка ядрица (мешки)', amount: 8, fullBagsCount: 7, currentBagKg: 20, bagCapacityKg: 25, category: 'concentrate', unit: 'меш', isDefault: true },
  { id: 'c13', parentId: 'concentrate', name: 'Кукуруза (мешки)', amount: 10, fullBagsCount: 9, currentBagKg: 25, bagCapacityKg: 30, category: 'concentrate', unit: 'меш', isDefault: true },
  { id: 'c14', parentId: 'concentrate', name: 'Семечки подсолнечника (мешки)', amount: 10, fullBagsCount: 9, currentBagKg: 20, bagCapacityKg: 25, category: 'concentrate', unit: 'меш', isDefault: true },
  { id: 'c15', parentId: 'concentrate', name: 'ФормаМакс Каша (мешки)', amount: 15, fullBagsCount: 14, currentBagKg: 20, bagCapacityKg: 25, category: 'concentrate', unit: 'меш', isDefault: true },
  { id: 'c16', parentId: 'concentrate', name: 'ОптиФорм Микс Юниор (мешки)', amount: 15, fullBagsCount: 14, currentBagKg: 20, bagCapacityKg: 25, category: 'concentrate', unit: 'меш', isDefault: true },
  { id: 'c17', parentId: 'concentrate', name: 'Mono Grass (мешки)', amount: 15, fullBagsCount: 14, currentBagKg: 20, bagCapacityKg: 25, category: 'concentrate', unit: 'меш', isDefault: true },
  { id: 'c7', parentId: 'concentrate', name: 'Псиллиум / Солевой премикс', amount: 10, category: 'concentrate', unit: 'уп', isDefault: true },
  { id: 'c8', parentId: 'concentrate', name: 'Мэш готовый (мешки)', amount: 15, fullBagsCount: 14, currentBagKg: 20, bagCapacityKg: 25, category: 'concentrate', unit: 'меш', isDefault: true },
  { id: 'c9', parentId: 'concentrate', name: 'Кальций / Связки и ногти', amount: 20, category: 'concentrate', unit: 'уп', isDefault: true },
  { id: 'c10', parentId: 'concentrate', name: 'Витаминный премикс роста', amount: 15, category: 'concentrate', unit: 'уп', isDefault: true },
  { id: 'j1', parentId: 'juicy', name: 'Морковь', amount: 150, category: 'juicy', unit: 'кг', isDefault: true },
  { id: 'j2', parentId: 'juicy', name: 'Свёкла', amount: 30, category: 'juicy', unit: 'кг', isDefault: true },
  { id: 'j3', parentId: 'juicy', name: 'Яблоки', amount: 50, category: 'juicy', unit: 'кг', isDefault: true },
  { id: 'j4', parentId: 'juicy', name: 'Тыква', amount: 20, category: 'juicy', unit: 'кг', isDefault: true },
  { id: 'j5', parentId: 'juicy', name: 'Кабачки', amount: 25, category: 'juicy', unit: 'кг', isDefault: true },
  { id: 'j6', parentId: 'juicy', name: 'Арбуз сезонный', amount: 40, category: 'juicy', unit: 'кг', isDefault: true },
  { id: 'j7', parentId: 'juicy', name: 'Бананы', amount: 15, category: 'juicy', unit: 'кг', isDefault: true }
];

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [elephants, setElephants] = useState<Elephant[]>([]);
  const [activeElephantId, setActiveElephantId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('slonovet_active_elephant');
      return saved !== null ? JSON.parse(saved) : '';
    } catch {
      return '';
    }
  });
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false); // Init to false, SafeGate handles its own loading
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [globalSaveStatus, setGlobalSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [fodderInventory, setFodderInventory] = useState<FodderItem[]>(() => {
    try {
      const saved = localStorage.getItem('slonovet_fodder_inventory') || localStorage.getItem('fodder_inventory');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(parsed.map((i: FodderItem) => i.id));
          const missingDefaults = INITIAL_FODDER_INVENTORY.filter(d => !existingIds.has(d.id));
          return [...parsed, ...missingDefaults];
        }
      }
      return INITIAL_FODDER_INVENTORY;
    } catch {
      return INITIAL_FODDER_INVENTORY;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('slonovet_fodder_inventory', JSON.stringify(fodderInventory));
    } catch (e) {
      console.warn('Failed to persist fodderInventory:', e);
    }
  }, [fodderInventory]);

  useEffect(() => {
    if (activeElephantId) {
      try {
        localStorage.setItem('slonovet_active_elephant', JSON.stringify(activeElephantId));
      } catch {}
    }
  }, [activeElephantId]);

  useEffect(() => {
    if (elephants.length > 0 && (!activeElephantId || !elephants.some(e => e.id === activeElephantId))) {
      setActiveElephantId(elephants[0].id);
    }
  }, [elephants, activeElephantId]);

  useEffect(() => {
    async function initData() {
      if (!profile) return;
      
      try {
        // Try to load from offline cache first for instant display
        const cachedEls = await getCachedElephants().catch(() => []);
        const cachedAsgs = await getCachedAssignments().catch(() => []);
        
        if (cachedEls && cachedEls.length > 0) {
          setElephants(cachedEls);
        } else {
          setElephants(DEFAULT_ELEPHANTS);
          cacheElephants(DEFAULT_ELEPHANTS).catch(() => {});
        }
        
        if (cachedAsgs && cachedAsgs.length > 0) {
          setAssignments(cachedAsgs);
        }
        
        // Then attempt to fetch latest from server in background if available
        try {
          const [els, asgs] = await Promise.all([
            supabaseService.getElephants(),
            supabaseService.getActiveAssignments()
          ]);
          
          if (els && els.length > 0) {
            setElephants(els);
            await cacheElephants(els).catch(() => {});
          }
          if (asgs && asgs.length > 0) {
            setAssignments(asgs);
            await cacheAssignments(asgs).catch(() => {});
          }
        } catch (fetchErr) {
          console.warn('Backend unavailable, running in offline mode:', fetchErr);
        }
        
      } catch (err) {
        console.warn('Offline cache access warning, using default elephants:', err);
        setElephants(prev => prev.length > 0 ? prev : DEFAULT_ELEPHANTS);
      }
    }
    initData();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) return;
    try {
      const channel = supabase
        .channel('public:assignments')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
          supabaseService.getActiveAssignments().then(asgs => {
            if (asgs && asgs.length > 0) {
              setAssignments(asgs);
            }
          }).catch(err => {
            console.warn('Realtime update fetch failed:', err);
          });
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.warn('Realtime channel error - operating offline');
          }
        });

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch {}
      };
    } catch (e) {
      console.warn('Failed to subscribe to realtime changes:', e);
    }
  }, [profile?.id]);

  const login = async (email: string, pass: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
      return true;
    } catch (err) {
      throw err;
    }
  };

  const logout = async () => {
    localStorage.removeItem('slon_keeper');
    localStorage.removeItem('slonovet_session_token');
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshAssignments = async () => {
    try {
      const asgs = await supabaseService.getActiveAssignments();
      if (asgs && asgs.length > 0) {
        setAssignments(asgs);
        await cacheAssignments(asgs).catch(() => {});
      }
    } catch (e) {
      console.warn('Failed to refresh assignments in background', e);
    }
  };

  const isAdmin = canManageUsers(profile);

  const updateFodderAmount = (id: string, delta: number) => {
    setFodderInventory(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (item.fullBagsCount !== undefined) {
        const newFull = Math.max(0, item.fullBagsCount + delta);
        return {
          ...item,
          fullBagsCount: newFull,
          amount: newFull + ((item.currentBagKg && item.currentBagKg > 0) ? 1 : 0)
        };
      }
      return {
        ...item,
        amount: Math.max(0, Math.round((item.amount + delta) * 100) / 100)
      };
    }));
  };

  const deductFodderKg = (id: string, kg: number) => {
    setFodderInventory(prev => prev.map(item => {
      if (item.id !== id) return item;

      // Concentrates with opened bag tracking
      if (item.fullBagsCount !== undefined && item.currentBagKg !== undefined) {
        const capacity = item.bagCapacityKg || 30;
        let newCurrent = Math.round((item.currentBagKg - kg) * 100) / 100;
        let newFullBags = item.fullBagsCount;

        // Deduction: if opened bag emptied, take from full bags
        while (newCurrent <= 0 && newFullBags > 0) {
          newFullBags -= 1;
          newCurrent = Math.round((newCurrent + capacity) * 100) / 100;
        }

        // Reversion/Restoration: if returned kg overflows opened bag, pack into full bags
        while (newCurrent >= capacity) {
          newFullBags += 1;
          newCurrent = Math.round((newCurrent - capacity) * 100) / 100;
        }

        if (newFullBags === 0 && newCurrent < 0) {
          newCurrent = 0;
        }

        const newAmount = newFullBags + (newCurrent > 0 ? 1 : 0);

        return {
          ...item,
          fullBagsCount: newFullBags,
          currentBagKg: newCurrent,
          amount: newAmount
        };
      }

      // Default item (e.g. succulent kg)
      return {
        ...item,
        amount: Math.max(0, Math.round((item.amount - kg) * 100) / 100)
      };
    }));
  };
  
  const addFodderItem = (item: FodderItem) => {
    setFodderInventory(prev => [...prev, item]);
  };
  
  const deleteFodderItem = (id: string) => {
    setFodderInventory(prev => prev.filter(item => item.id !== id));
  };
  
  const editFodderItem = (id: string, updates: Partial<FodderItem>) => {
    setFodderInventory(prev => prev.map(item => {
      if (item.id !== id) return item;
      const merged = { ...item, ...updates };
      if (merged.fullBagsCount !== undefined && merged.currentBagKg !== undefined) {
        merged.amount = merged.fullBagsCount + (merged.currentBagKg > 0 ? 1 : 0);
      }
      return merged;
    }));
  };

  return (
    <StoreContext.Provider value={{
      profile, setProfile, isAdmin, elephants, activeElephantId, setActiveElephantId, assignments, loading, selectedDate, login, logout, refreshAssignments, setSelectedDate, globalSaveStatus, setGlobalSaveStatus,
      fodderInventory, updateFodderAmount, deductFodderKg, addFodderItem, deleteFodderItem, editFodderItem
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error('useStore must be used within a StoreProvider');
  return context;
}
