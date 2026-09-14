import React, { useEffect, useState } from 'react';
import { X, Send, Loader2, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Profile } from '../../types';
import { shiftService } from '../../services/shiftService';

interface ShiftHandoverModalProps {
  shiftId: string;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ShiftHandoverModal({ shiftId, currentUserId, onClose, onSuccess }: ShiftHandoverModalProps) {
  const [keepers, setKeepers] = useState<Profile[]>([]);
  const [loadingKeepers, setLoadingKeepers] = useState(true);
  
  const [selectedKeeperId, setSelectedKeeperId] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadKeepers() {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('role', 'keeper')
          .eq('active', true);
          
        if (error) throw error;
        
        // Filter out the current user
        const otherKeepers = (data || []).filter(k => k.id !== currentUserId);
        setKeepers(otherKeepers);
      } catch (err) {
        console.error('Failed to load keepers:', err);
      } finally {
        setLoadingKeepers(false);
      }
    }
    
    loadKeepers();
  }, [currentUserId]);

  const handleSubmit = async () => {
    if (!selectedKeeperId) {
      setError('Выберите кипера для передачи дежурства');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await shiftService.initiateHandover(shiftId, selectedKeeperId, notes.trim());
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ошибка при передаче дежурства');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-[28px] shadow-2xl overflow-hidden flex flex-col border border-white">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white/50">
          <h3 className="font-black text-lg text-slate-800">Передача дежурства</h3>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:text-slate-700 active:scale-95 transition-all"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 text-red-600 text-sm font-bold border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Кому передать дежурство
            </label>
            {loadingKeepers ? (
              <div className="h-12 bg-slate-100 rounded-2xl animate-pulse" />
            ) : keepers.length === 0 ? (
              <div className="p-3 text-sm text-amber-600 bg-amber-50 rounded-2xl border border-amber-100">
                Нет доступных киперов для передачи смены
              </div>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {keepers.map(keeper => (
                  <button
                    key={keeper.id}
                    onClick={() => setSelectedKeeperId(keeper.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${
                      selectedKeeperId === keeper.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-transparent bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      selectedKeeperId === keeper.id ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {keeper.avatar_url ? (
                        <img src={keeper.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={18} strokeWidth={2.5} />
                      )}
                    </div>
                    <div className="font-bold text-slate-800 flex-1 truncate text-sm">
                      {keeper.name}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
              Заметки для сменщика (необязательно)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Что нужно знать сменщику..."
              className="w-full min-h-[100px] resize-none bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm"
            />
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50/80">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedKeeperId}
            className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 text-white font-black shadow-lg shadow-emerald-500/25"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Send size={18} strokeWidth={2.5} />
                Отправить дежурство
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
