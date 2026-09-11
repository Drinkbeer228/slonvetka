import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { Profile, Elephant, Assignment } from '../types';
import { cacheElephants, cacheAssignments, getCachedElephants, getCachedAssignments } from '../services/offlineDb';

interface StoreState {
  profile: Profile | null;
  elephants: Elephant[];
  assignments: Assignment[];
  loading: boolean;
  selectedDate: string;
  activeElephantId: string;
  globalSaveStatus: 'idle' | 'saving' | 'saved' | 'error';
}

interface StoreContextType extends StoreState {
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAssignments: () => Promise<void>;
  setSelectedDate: (date: string) => void;
  setActiveElephantId: (id: string) => void;
  setGlobalSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [elephants, setElephants] = useState<Elephant[]>([]);
  const [activeElephantId, setActiveElephantId] = useState<string>('');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [globalSaveStatus, setGlobalSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (elephants.length > 0 && (!activeElephantId || !elephants.some(e => e.id === activeElephantId))) {
      setActiveElephantId(elephants[0].id);
    }
  }, [elephants, activeElephantId]);

  // Initial session check and auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          loadProfile(session.user.id);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      let p = await supabaseService.getProfile(userId);
      let attempts = 0;
      // Retry fetching profile up to 3 times to allow database trigger to complete
      while (!p && attempts < 3) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 1000));
        p = await supabaseService.getProfile(userId);
      }
      
      if (!p) {
        console.warn('Профиль не найден. Возможно, отсутствует SQL-триггер в базе данных.');
      }
      
      setProfile(p);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <StoreContext.Provider value={{
      profile, elephants, activeElephantId, setActiveElephantId, assignments, loading, selectedDate, login, logout, refreshAssignments, setSelectedDate, globalSaveStatus, setGlobalSaveStatus
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

