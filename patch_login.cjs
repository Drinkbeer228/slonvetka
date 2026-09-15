const fs = require('fs');
let file = 'src/components/auth/LoginPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetState = `  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);`;
const replacementState = `  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);`;
code = code.replace(targetState, replacementState);

const targetHandle = `  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);

    const cleanLogin = login.trim().toLowerCase();
    // Если введен короткий логин (adk, dima), приклеиваем домен:
    const email = cleanLogin.includes('@') ? cleanLogin : \`\${cleanLogin}@slonovet.local\`;
    const cleanPassword = password.trim();

    console.log('Попытка входа с email:', email);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: cleanPassword,
    });

    if (signInError) {
      console.error('Ошибка входа:', signInError.message);
      setError(signInError.message);
      setAuthLoading(false);
      return;
    }`;

const replacementHandle = `  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);

    const cleanLogin = login.trim().toLowerCase();
    const email = cleanLogin.includes('@') ? cleanLogin : \`\${cleanLogin}@slonovet.local\`;
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
            role: cleanLogin === 'admin' ? 'admin' : 'keeper'
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
    }`;
code = code.replace(targetHandle, replacementHandle);

const targetUI = `<button
            type="submit"
            disabled={authLoading || !login.trim() || !password.trim()}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-14 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              'Войти в систему'
            )}
          </button>`;
const replacementUI = `<button
            type="submit"
            disabled={authLoading || !login.trim() || !password.trim()}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold h-14 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center shadow-lg shadow-slate-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {authLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              isRegisterMode ? 'Зарегистрироваться' : 'Войти в систему'
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setIsRegisterMode(!isRegisterMode)}
            className="w-full mt-4 text-sm font-medium text-slate-500 hover:text-slate-700 transition"
          >
            {isRegisterMode ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Зарегистрироваться (первый вход)'}
          </button>`;
code = code.replace(targetUI, replacementUI);

fs.writeFileSync(file, code);
