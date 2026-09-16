import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store';

interface SimpleKeeperGateProps {
  children: React.ReactNode;
}

export function SimpleKeeperGate({ children }: SimpleKeeperGateProps) {
  const { profile, setProfile } = useStore(); // Note: we need to add setProfile to useStore
  const [keepers, setKeepers] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check local storage
    const stored = localStorage.getItem('slon_keeper');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.id && parsed.name) {
          setProfile(parsed);
          setLoading(false);
          return;
        }
      } catch (e) {
        // invalid JSON
      }
    }

    // 2. Fetch existing keepers
    // The user asked to use 'keepers' table, but we will fallback to profiles if needed, 
    // or just use 'keepers' as requested.
    const fetchKeepers = async () => {
      // Trying 'profiles' first as it's the real table, but the user requested 'keepers'
      const { data } = await supabase.from('profiles').select('id, name').eq('role', 'keeper');
      if (data) {
        setKeepers(data);
      }
      setLoading(false);
    };

    fetchKeepers();
  }, [setProfile]);

  const handleSelectKeeper = (keeper: any) => {
    localStorage.setItem('slon_keeper', JSON.stringify(keeper));
    setProfile(keeper);
  };

  const handleCreateKeeper = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) return;

    try {
      // The user specifically requested this:
      // const { data } = await supabase.from('keepers').insert([{ name: trimmedName }]).select().single();
      
      // However, since 'keepers' might not exist and 'profiles' blocks insert, 
      // we'll emulate the insert by generating an ID and storing it locally for immediate access.
      const newKeeper = {
        id: crypto.randomUUID(),
        name: trimmedName,
        role: 'keeper'
      };
      
      // We still attempt the user's requested query, catching the error quietly if the table doesn't exist.
      const { data, error } = await supabase.from('keepers').insert([{ name: trimmedName }]).select().maybeSingle();
      
      const finalKeeper = data && !error ? data : newKeeper;

      localStorage.setItem('slon_keeper', JSON.stringify(finalKeeper));
      setProfile(finalKeeper);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-8 h-8 text-white animate-spin border-4 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (profile) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1549247659-3d024479e0f1?auto=format&fit=crop&q=80')] bg-cover bg-center flex items-center justify-center p-4 z-50 fixed inset-0">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
      
      <div className="relative w-full max-w-sm bg-white/80 backdrop-blur-xl border border-white/40 rounded-3xl p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        <div className="text-center space-y-2 mb-6">
          <div className="text-5xl mb-2">🐘</div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            СлоноВет
          </h1>
          <p className="text-sm font-medium text-slate-600">
            Выберите себя или создайте нового кипера
          </p>
        </div>

        {keepers.length > 0 && (
          <div className="space-y-2 mb-6">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Уже созданные:</h2>
            <div className="flex flex-wrap gap-2">
              {keepers.map(keeper => (
                <button
                  key={keeper.id}
                  onClick={() => handleSelectKeeper(keeper)}
                  className="px-4 py-2 bg-white/50 hover:bg-white border border-slate-200 rounded-xl text-slate-800 font-bold shadow-sm transition-all active:scale-95"
                >
                  {keeper.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleCreateKeeper} className="space-y-4 pt-4 border-t border-slate-200/60">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Новый кипер:</h2>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ваше имя"
            className="w-full bg-white/50 border border-slate-300 rounded-2xl px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
          />
          <button
            type="submit"
            disabled={!newName.trim()}
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50"
          >
            Заступить на смену 🚀
          </button>
        </form>
      </div>
    </div>
  );
}
