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
  addFodderItem: (item: FodderItem) => void;
  deleteFodderItem: (id: string) => void;
  editFodderItem: (id: string, updates: Partial<FodderItem>) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [elephants, setElephants] = useState<Elephant[]>([]);
  const [activeElephantId, setActiveElephantId] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false); // Init to false, SafeGate handles its own loading
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [globalSaveStatus, setGlobalSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [fodderInventory, setFodderInventory] = useState<FodderItem[]>([
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

    { id: '4', parentId: 'concentrate', name: 'Овёс (мешки)', amount: 20, category: 'concentrate', unit: 'меш', isDefault: true },
    { id: '5', parentId: 'concentrate', name: 'Отруби (мешки)', amount: 12, category: 'concentrate', unit: 'меш', isDefault: true },
    { id: '6', parentId: 'juicy', name: 'Морковь', amount: 150, category: 'juicy', unit: 'кг', isDefault: true },
    { id: '7', parentId: 'juicy', name: 'Свекла', amount: 30, category: 'juicy', unit: 'кг', isDefault: true }
  ]);

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
        const cachedEls = await getCachedElephants();
        const cachedAsgs = await getCachedAssignments();
        
        if (cachedEls.length > 0) setElephants(cachedEls);
        if (cachedAsgs.length > 0) setAssignments(cachedAsgs);
        
        // Then fetch latest from server
        const [els, asgs] = await Promise.all([
          supabaseService.getElephants(),
          supabaseService.getActiveAssignments()
        ]);
        
        setElephants(els);
        setAssignments(asgs);
        
        // Update cache
        await cacheElephants(els);
        await cacheAssignments(asgs);
        
      } catch (err) {
        console.error('Failed to load data, relying on cache if available:', err);
      }
    }
    initData();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile) return;
    const channel = supabase
      .channel('public:assignments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'assignments' }, () => {
        supabaseService.getActiveAssignments().then(setAssignments);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
      setAssignments(asgs);
      await cacheAssignments(asgs);
    } catch (e) {
      console.error('Failed to refresh assignments in background', e);
    }
  };

  const isAdmin = canManageUsers(profile);

  const updateFodderAmount = (id: string, delta: number) => {
    setFodderInventory(prev => prev.map(item => item.id === id ? { ...item, amount: item.amount + delta } : item));
  };
  
  const addFodderItem = (item: FodderItem) => {
    setFodderInventory(prev => [...prev, item]);
  };
  
  const deleteFodderItem = (id: string) => {
    setFodderInventory(prev => prev.filter(item => item.id !== id));
  };
  
  const editFodderItem = (id: string, updates: Partial<FodderItem>) => {
    setFodderInventory(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  return (
    <StoreContext.Provider value={{
      profile, setProfile, isAdmin, elephants, activeElephantId, setActiveElephantId, assignments, loading, selectedDate, login, logout, refreshAssignments, setSelectedDate, globalSaveStatus, setGlobalSaveStatus,
      fodderInventory, updateFodderAmount, addFodderItem, deleteFodderItem, editFodderItem
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
