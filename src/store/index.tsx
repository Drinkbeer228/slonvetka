import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabaseService } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { Profile, Elephant, Assignment } from '../types';

interface StoreState {
  profile: Profile | null;
  elephants: Elephant[];
  assignments: Assignment[];
  loading: boolean;
}

interface StoreContextType extends StoreState {
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshAssignments: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [elephants, setElephants] = useState<Elephant[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

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
        const [els, asgs] = await Promise.all([
          supabaseService.getElephants(),
          supabaseService.getActiveAssignments()
        ]);
        setElephants(els);
        setAssignments(asgs);
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    }
    initData();
  }, [profile]);

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
  }, [profile]);

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
    const asgs = await supabaseService.getActiveAssignments();
    setAssignments(asgs);
  };

  return (
    <StoreContext.Provider value={{
      profile, elephants, assignments, loading, login, logout, refreshAssignments
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

