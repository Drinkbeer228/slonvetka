import React from 'react';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmDeleteModalProps {
  title?: string;
  description?: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDeleteModal({
  title = 'Удалить запись?',
  description = 'Запись о процедуре будет безвозвратно удалена из журнала.',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-2">
          <AlertTriangle size={24} />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-lg font-black text-zinc-900 tracking-tight">{title}</h3>
          <p className="text-xs font-medium text-zinc-500">{description}</p>
        </div>

        <div className="pt-2 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-1/2 py-2.5 rounded-xl border border-zinc-200 font-bold text-xs text-zinc-600 hover:bg-zinc-50 transition"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="w-1/2 py-2.5 bg-red-600 hover:bg-red-700 active:scale-[0.99] text-white rounded-xl font-bold text-xs shadow transition flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Удаление...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Удалить</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
