import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { Camera, X, Loader2, Save, Key } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface ProfileSettingsModalProps {
  onClose: () => void;
}

export function ProfileSettingsModal({ onClose }: ProfileSettingsModalProps) {
  const { profile, setProfile } = useStore();
  
  const [name, setName] = useState(profile?.name || '');
  const [birthDate, setBirthDate] = useState(profile?.birth_date || '');
  const [newPassword, setNewPassword] = useState('');
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  if (!profile) return null;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const compressed = await compressImage(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}_${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('elephant-treatments')
        .upload(filePath, compressed);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('elephant-treatments')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      setSuccess('Аватар обновлен!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError('Ошибка при загрузке фото');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updates: any = {};
      
      if (name.trim() && name.trim() !== profile.name) {
        updates.name = name.trim();
      }
      if (birthDate !== profile.birth_date) {
        updates.birth_date = birthDate || null;
      }

      // 1. Сохранение данных профиля
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', profile.id);
          
        if (updateError) throw updateError;
        setProfile({ ...profile, ...updates });
      }

      // 2. Смена пароля
      if (newPassword.trim()) {
        const { error: pwError } = await supabase.auth.updateUser({
          password: newPassword.trim()
        });
        
        if (pwError) throw pwError;
        setNewPassword(''); // очищаем после успешной смены
      }

      setSuccess('Профиль успешно обновлен!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Произошла ошибка при сохранении');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl border border-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/50 shrink-0">
          <h2 className="text-xl font-black text-slate-800">Профиль</h2>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Avatar Upload */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-slate-200 border-4 border-white shadow-sm overflow-hidden flex items-center justify-center">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-600 font-bold text-2xl uppercase">
                    {profile.name.substring(0, 2)}
                  </div>
                )}
                
                {uploading && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                  </div>
                )}
              </div>
              
              <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 hover:text-emerald-500 hover:border-emerald-200 cursor-pointer transition-colors active:scale-95">
                <Camera size={16} strokeWidth={2.5} />
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload} 
                  disabled={uploading}
                />
              </label>
            </div>
            
            <div className="text-center">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1">
                Роль: {profile.role}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Имя сотрудника
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Имя Фамилия"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Дата рождения
              </label>
              <input
                type="date"
                value={birthDate}
                onChange={e => setBirthDate(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            <div className="pt-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 ml-1">
                Новый пароль
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Key size={18} strokeWidth={2.5} />
                </div>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Оставьте пустым, если не меняете"
                />
              </div>
            </div>
          </div>
          
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-semibold rounded-2xl text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-semibold rounded-2xl text-center">
              {success}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black shadow-lg shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Save size={18} strokeWidth={2.5} />
                Сохранить профиль
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
