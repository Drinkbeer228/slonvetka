import React, { useState } from 'react';
import { useStore } from '../store';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface KeeperSelectionScreenProps {
  onComplete: () => void;
}

export function KeeperSelectionScreen({ onComplete }: KeeperSelectionScreenProps) {
  const { profile, login, logout, loading: storeLoading } = useStore();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  
  // Login state
  const [loginName, setLoginName] = useState('');
  const [pin, setPin] = useState('');
  
  // Register state
  const [regName, setRegName] = useState('');
  const [regLogin, setRegLogin] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regSecret, setRegSecret] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isSupabaseConfigured) {
      setError('База данных Supabase не настроена.');
      return;
    }

    if (!loginName.trim() || !pin.trim()) {
      setError('Введите логин и ПИН-код');
      return;
    }

    setLoading(true);
    try {
      const normalizedLogin = loginName.trim().toLowerCase();
      const email = normalizedLogin.includes('@') 
        ? normalizedLogin 
        : `${normalizedLogin}@mail.ru`;

      const success = await login(email, pin.trim());
      if (success) {
        onComplete();
      }
    } catch (err: any) {
      setError('Ошибка при входе: неверный логин или ПИН-код');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isSupabaseConfigured) {
      setError('База данных Supabase не настроена.');
      return;
    }

    if (!regName.trim() || !regLogin.trim() || !regPin.trim() || !regSecret.trim()) {
      setError('Заполните все поля');
      return;
    }

    setLoading(true);
    try {
      const normalizedLogin = regLogin.trim().toLowerCase();
      const email = normalizedLogin.includes('@') 
        ? normalizedLogin 
        : `${normalizedLogin}@mail.ru`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password: regPin.trim(),
        options: {
          data: {
            name: regName.trim(),
            role: 'keeper',
          },
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (!data.session) {
        await supabase.auth.signInWithPassword({
          email,
          password: regPin.trim(),
        });
      }

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Ошибка при регистрации');
    } finally {
      setLoading(false);
    }
  };

  if (storeLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="animate-spin text-zinc-400 mb-4" size={32} />
        <p className="text-zinc-500 font-medium">Загрузка сессии...</p>
      </div>
    );
  }

  if (profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🐘</div>
          <h1 className="text-3xl font-black mb-2">СлоноВет</h1>
        </div>
        <div className="w-full bg-white p-6 rounded-3xl border border-zinc-200 text-center shadow-sm">
          <p className="text-zinc-500 font-medium text-sm mb-2">Вы вошли как:</p>
          <p className="font-bold text-xl mb-1">{profile.name}</p>
          <p className="text-sm font-bold text-blue-600 bg-blue-50 py-1 px-3 rounded-full inline-block mb-6 uppercase tracking-wider">
            {profile.role === 'vet' ? 'Ветврач' : 'Кипер'}
          </p>
          
          <button
            onClick={async () => { await logout(); onComplete(); }}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition"
          >
            Выйти из смены
          </button>
        </div>
      </div>
    );
  }

  return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] max-w-md mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <div className="text-6xl mb-4">🐘</div>
        <h1 className="text-3xl font-black mb-2">СлоноВет</h1>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-6 w-full bg-amber-50 border-2 border-amber-200 text-amber-800 p-4 rounded-xl text-sm font-bold text-center">
          ⚠️ Приложение не подключено к Supabase.<br/>
          Добавьте переменные окружения VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в настройки приложения.
        </div>
      )}

      <div className="w-full">
        <div className="flex bg-zinc-100 p-1 rounded-xl mb-6">
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${tab === 'login' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Вход
          </button>
          <button
            type="button"
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition ${tab === 'register' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            onClick={() => { setTab('register'); setError(''); }}
          >
            Регистрация
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div>
              <input
                type="text"
                value={loginName}
                onChange={(e) => setLoginName(e.target.value)}
                placeholder="Логин"
                className="w-full px-5 py-4 bg-zinc-100 border-2 border-transparent focus:bg-white rounded-2xl font-bold text-lg text-center focus:outline-none focus:border-zinc-900 transition"
                autoComplete="username"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
            <div>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Пароль"
                className="w-full px-5 py-4 bg-zinc-100 border-2 border-transparent focus:bg-white rounded-2xl font-bold text-lg tracking-[0.5em] text-center focus:outline-none focus:border-zinc-900 transition"
                autoComplete="current-password"
              />
            </div>
            
            {error && (
              <p className="text-red-500 font-bold text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white font-black py-4 rounded-xl hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'ВХОД...' : 'ВОЙТИ'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="w-full space-y-4">
            <div>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                placeholder="Имя (например, Дима)"
                className="w-full px-5 py-4 bg-zinc-100 border-2 border-transparent focus:bg-white rounded-2xl font-bold text-lg focus:outline-none focus:border-zinc-900 transition"
                autoComplete="name"
              />
            </div>
            <div>
              <input
                type="text"
                value={regLogin}
                onChange={(e) => setRegLogin(e.target.value)}
                placeholder="Придумайте логин"
                className="w-full px-5 py-4 bg-zinc-100 border-2 border-transparent focus:bg-white rounded-2xl font-bold text-lg focus:outline-none focus:border-zinc-900 transition"
                autoComplete="off"
                autoCorrect="off"
                spellCheck="false"
              />
            </div>
            <div>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={regPin}
                onChange={(e) => setRegPin(e.target.value)}
                placeholder="Придумайте ПИН (6 цифр)"
                className="w-full px-5 py-4 bg-zinc-100 border-2 border-transparent focus:bg-white rounded-2xl font-bold text-lg tracking-[0.5em] text-center focus:outline-none focus:border-zinc-900 transition"
                autoComplete="new-password"
              />
            </div>
            <div>
              <input
                type="text"
                value={regSecret}
                onChange={(e) => setRegSecret(e.target.value)}
                placeholder="Код объекта (пароль слоновника)"
                className="w-full px-5 py-4 bg-amber-50 border-2 border-amber-200 rounded-2xl font-bold text-lg focus:outline-none focus:border-amber-400 transition placeholder:text-amber-300"
                autoComplete="off"
              />
            </div>
            
            {error && (
              <p className="text-red-500 font-bold text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-900 text-white font-black py-4 rounded-xl hover:bg-zinc-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'РЕГИСТРАЦИЯ...' : 'ЗАРЕГИСТРИРОВАТЬСЯ'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

