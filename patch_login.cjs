const fs = require('fs');
const file = 'src/components/auth/LoginPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /const handleLogin = async \(e: React\.FormEvent\) => \{[\s\S]*?\}\s*};\s*if \(loading\)/;

const newHandleLogin = `const handleLogin = async (e: React.FormEvent) => {
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
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    }
    setAuthLoading(false);
  };

  if (loading)`;

if (regex.test(code)) {
  code = code.replace(regex, newHandleLogin);
  fs.writeFileSync(file, code);
  console.log('Patched handleLogin successfully');
} else {
  console.log('Could not match handleLogin');
}
