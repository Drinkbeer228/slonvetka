import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { useStore } from '../store';
import { Plus, X, Loader2, User } from 'lucide-react';

// Create a separate Supabase client that doesn't persist the session.
// This allows us to sign up a new user without logging out the current admin.
const tempSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);

interface StaffProfile {
  id: string;
  name: string;
  role: 'vet' | 'keeper';
}

export function StaffScreen() {
  const { profile } = useStore();
  const [staff, setStaff] = useState<StaffProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  
  const [regName, setRegName] = useState('');
  const [regLogin, setRegLogin] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regRole, setRegRole] = useState<'keeper' | 'vet'>('keeper');
  
  const [createLoading, setCreateLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role')
        .order('name');
      
      if (error) throw error;
      setStaff(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'vet') {
      fetchStaff();
    }
  }, [profile]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName.trim() || !regLogin.trim() || !regPin.trim()) {
      setError('Заполните все поля');
      return;
    }

    if (regPin.length !== 6) {
      setError('ПИН-код должен состоять из 6 цифр');
      return;
    }

    setCreateLoading(true);
    try {
      const normalizedLogin = regLogin.trim().toLowerCase();
      const email = `${normalizedLogin}@mail.ru`;

      const { data, error: signUpError } = await tempSupabase.auth.signUp({
        email,
        password: regPin.trim(),
        options: {
          data: {
            name: regName.trim(),
            role: regRole,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Close modal and refresh list
      setModalOpen(false);
      setRegName('');
      setRegLogin('');
      setRegPin('');
      setRegRole('keeper');
      fetchStaff();
      
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании сотрудника');
    } finally {
      setCreateLoading(false);
    }
  };

  if (profile?.role !== 'vet') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <span className="text-4xl mb-4">⛔</span>
        <h2 className="text-xl font-black text-zinc-900 mb-2">Доступ запрещен</h2>
        <p className="text-zinc-500 font-medium text-sm">Этот раздел доступен только ветврачам.</p>
      </div>
    );
  }

  return (
    <div className="pb-8 space-y-6 mt-4 relative">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Сотрудники</h1>
          <p className="text-zinc-500 font-medium text-sm mt-1">Управление командой</p>
        </div>
        <button
          onClick={() => { setModalOpen(true); setError(''); }}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2 px-4 rounded-xl transition active:scale-95"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-zinc-400" size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {staff.map((member) => (
            <div key={member.id} className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-200 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 shrink-0">
                <User size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg text-zinc-900">{member.name}</h3>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider ${
                  member.role === 'vet' ? 'bg-blue-50 text-blue-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {member.role === 'vet' ? 'Ветврач' : 'Кипер'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 bg-zinc-900 text-white flex items-center justify-between shrink-0">
              <h2 className="font-bold text-lg">Новый сотрудник</h2>
              <button 
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <form id="staff-form" onSubmit={handleCreateStaff} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Имя</label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Например, Ормандо"
                    className="w-full px-4 py-3 bg-zinc-100 border-2 border-transparent focus:bg-white rounded-xl font-bold focus:outline-none focus:border-zinc-900 transition"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Логин</label>
                  <input
                    type="text"
                    value={regLogin}
                    onChange={(e) => setRegLogin(e.target.value)}
                    placeholder="Например, ormando"
                    className="w-full px-4 py-3 bg-zinc-100 border-2 border-transparent focus:bg-white rounded-xl font-bold focus:outline-none focus:border-zinc-900 transition"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">ПИН-код (6 цифр)</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    placeholder="Пароль"
                    className="w-full px-4 py-3 bg-zinc-100 border-2 border-transparent focus:bg-white rounded-xl font-bold tracking-[0.5em] text-center focus:outline-none focus:border-zinc-900 transition"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Роль</label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as 'keeper' | 'vet')}
                    className="w-full px-4 py-3 bg-zinc-100 border-2 border-transparent focus:bg-white rounded-xl font-bold focus:outline-none focus:border-zinc-900 transition"
                  >
                    <option value="keeper">Кипер</option>
                    <option value="vet">Ветврач</option>
                  </select>
                </div>

                {error && (
                  <p className="text-red-500 font-bold text-sm bg-red-50 py-2 px-3 rounded-lg text-center">{error}</p>
                )}
              </form>
            </div>

            <div className="p-4 bg-zinc-50 border-t border-zinc-200 shrink-0 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-6 py-3 rounded-xl font-bold bg-white border-2 border-zinc-200 text-zinc-600 hover:bg-zinc-100 transition"
              >
                Отмена
              </button>
              <button
                form="staff-form"
                type="submit"
                disabled={createLoading}
                className="px-6 py-3 rounded-xl font-black bg-zinc-900 text-white hover:bg-zinc-800 transition flex items-center justify-center min-w-[140px] disabled:opacity-50"
              >
                {createLoading ? <Loader2 className="animate-spin" size={20} /> : 'СОЗДАТЬ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
