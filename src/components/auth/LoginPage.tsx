import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useStore } from '../../store';
import { authService } from '../../services/authService';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { SplashScreen } from '../common/SplashScreen';

interface LoginPageProps {
  children: React.ReactNode;
}

export function LoginPage({ children }: LoginPageProps) {
  const { profile, setProfile } = useStore();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // Получаем профиль
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (profileData) {
            const localToken = localStorage.getItem('slonovet_session_token');
            // Проверка активной сессии
            if (localToken) {
              const isValid = await authService.verifyDeviceSession(session.user.id, localToken);
              if (!isValid) {
                await handleSignOut('Выполнен вход с другого устройства. Сессия завершена');
                return;
              }
            } else {
              // Если нет локального токена, но есть сессия, сгенерируем и зарегистрируем
              const newToken = crypto.randomUUID();
              localStorage.setItem('slonovet_session_token', newToken);
              await authService.registerDeviceSession(session.user.id, newToken);
            }
            
            setProfile(profileData);
          } else {
            await handleSignOut();
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();

    // Слушатель изменений сессии (в другой вкладке и т.д.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('slonovet_session_token');
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setProfile]);

  // Фоновая проверка сессии
  useEffect(() => {
    if (!profile) return;
    
    const checkSession = async () => {
      const localToken = localStorage.getItem('slonovet_session_token');
      if (localToken && profile) {
        const isValid = await authService.verifyDeviceSession(profile.id, localToken);
        if (!isValid) {
          await handleSignOut('Выполнен вход с другого устройства. Сессия завершена');
        }
      }
    };

    // Проверять каждые 30 секунд или при фокусе окна
    const interval = setInterval(checkSession, 30000);
    window.addEventListener('focus', checkSession);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkSession);
    };
  }, [profile, setProfile]);

  const handleSignOut = async (msg?: string) => {
    localStorage.removeItem('slonovet_session_token');
    await supabase.auth.signOut();
    setProfile(null);
    setLoading(false);
    if (msg) {
      alert(msg); // Простой alert (в идеале toast)
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);

    const cleanLogin = login.trim().toLowerCase();
    const email = cleanLogin.includes('@') ? cleanLogin : `${cleanLogin}@slonovet.local`;
    const cleanPassword = password.trim();

    if (isRegisterMode) {
      if (cleanPassword.length < 6) {
        setError('Пароль должен быть не менее 6 символов');
        setAuthLoading(false);
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: cleanPassword,
        options: {
          data: {
            name: cleanLogin.split('@')[0],
          }
        }
      });
      if (signUpError) {
        setError(signUpError.message);
        setAuthLoading(false);
        return;
      }
      if (data.user) {
        alert('Регистрация успешна! Теперь вы можете войти (если настроены триггеры БД).');
        setIsRegisterMode(false);
      }
      setAuthLoading(false);
      return;
    }

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: cleanPassword,
    });

    if (signInError) {
      setError(signInError.message);
      setAuthLoading(false);
      return;
    }

    // Успешный вход — Supabase сам сохранит сессию
    if (data.user) {
      const sessionToken = crypto.randomUUID();
      localStorage.setItem('slonovet_session_token', sessionToken);
      await authService.registerDeviceSession(data.user.id, sessionToken);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);
      }
    }
    setAuthLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (profile) {
    if (showSplash) {
      return <SplashScreen onFinish={() => setShowSplash(false)} />;
    }
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[url('https://images.unsplash.com/photo-1549247659-3d024479e0f1?auto=format&fit=crop&q=80')] bg-cover bg-center flex items-center justify-center p-4 z-50 fixed inset-0">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" />
      
      <div className="relative w-full max-w-sm bg-white/80 backdrop-blur-xl border border-white/40 rounded-[28px] p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        <div className="text-center space-y-2 mb-8">
          <div className="text-5xl mb-4">🐘</div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            СлоноВет
          </h1>
          <p className="text-sm font-medium text-slate-600">
            Введите логин и пароль
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 text-red-600 text-sm font-semibold rounded-2xl text-center">
              {error}
            </div>
          )}

          <div>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="Логин"
              autoCapitalize="none"
              autoCorrect="off"
              className="w-full bg-white/50 border border-slate-300 rounded-2xl px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
            />
          </div>

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              className="w-full bg-white/50 border border-slate-300 rounded-2xl pl-4 pr-12 py-3.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!login.trim() || !password || authLoading}
            className="w-full py-4 min-h-[44px] mt-2 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50"
          >
            {authLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Войти 🚀'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
