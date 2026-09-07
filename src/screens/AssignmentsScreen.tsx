import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { supabaseService } from '../services/supabaseService';
import { Assignment } from '../types';
import { Plus, Loader2 } from 'lucide-react';
import { AssignmentModal } from '../components/AssignmentModal';

export function AssignmentsScreen() {
  const { elephants, profile, refreshAssignments } = useStore();
  const [localAssignments, setLocalAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedElephantId, setSelectedElephantId] = useState<string>('all');
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

  const fetchAllAssignments = async () => {
    setLoading(true);
    try {
      const all = await supabaseService.getAllAssignments();
      setLocalAssignments(all);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'vet') {
      fetchAllAssignments();
    }
  }, [profile]);

  if (profile?.role !== 'vet') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
        <span className="text-4xl mb-4">⛔</span>
        <h2 className="text-xl font-black text-zinc-900 mb-2">Доступ запрещен</h2>
        <p className="text-zinc-500 font-medium text-sm">Этот раздел доступен только ветврачам.</p>
      </div>
    );
  }

  const handleToggleActive = async (assignment: Assignment) => {
    try {
      // Optimistic update
      setLocalAssignments(prev => prev.map(a => 
        a.id === assignment.id ? { ...a, is_active: !a.is_active } : a
      ));
      
      await supabaseService.updateAssignment(assignment.id, {
        is_active: !assignment.is_active
      });
      
      // Refresh global store just in case
      refreshAssignments();
    } catch (err) {
      console.error(err);
      // Revert on error
      fetchAllAssignments();
    }
  };

  const handleModalSaved = async () => {
    setModalOpen(false);
    setEditingAssignment(null);
    await fetchAllAssignments();
    refreshAssignments(); // Sync active assignments with store
  };

  const filteredAssignments = selectedElephantId === 'all' 
    ? localAssignments 
    : localAssignments.filter(a => a.elephant_id === selectedElephantId);

  return (
    <div className="pb-8 space-y-6 mt-4 relative">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Управление назначениями</h1>
          <p className="text-zinc-500 font-medium text-sm mt-1">Панель Ветврача</p>
        </div>
        <button
          onClick={() => { setEditingAssignment(null); setModalOpen(true); }}
          className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2 px-4 rounded-xl transition active:scale-95"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">Новое назначение</span>
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedElephantId('all')}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition border-2 ${selectedElephantId === 'all' ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}
        >
          Все слоны
        </button>
        {elephants.map(el => (
          <button
            key={el.id}
            onClick={() => setSelectedElephantId(el.id)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition border-2 ${selectedElephantId === el.id ? 'bg-zinc-900 border-zinc-900 text-white shadow-md' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}
          >
            {el.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-zinc-400" size={32} />
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-zinc-200">
          <p className="text-zinc-500 font-bold">Назначений не найдено</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map(assignment => {
            const elephant = elephants.find(e => e.id === assignment.elephant_id);
            return (
              <div key={assignment.id} className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-colors ${assignment.is_active ? 'border-zinc-200' : 'border-zinc-100 bg-zinc-50'}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`font-black text-lg leading-tight ${assignment.is_active ? 'text-zinc-900' : 'text-zinc-400 line-through decoration-zinc-300'}`}>
                        {assignment.title}
                      </div>
                      <div className={`text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap ${assignment.is_active ? 'bg-zinc-100 text-zinc-600' : 'bg-zinc-200/50 text-zinc-400'}`}>
                        {assignment.schedule_type}
                      </div>
                    </div>
                    <div className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase inline-block mb-3">
                      {elephant?.name}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => { setEditingAssignment(assignment); setModalOpen(true); }}
                      className="px-3 py-1.5 text-xs font-bold bg-white border-2 border-zinc-200 text-zinc-600 rounded-lg hover:border-zinc-400 hover:text-zinc-900 transition"
                    >
                      ИЗМЕНИТЬ
                    </button>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={assignment.is_active}
                        onChange={() => handleToggleActive(assignment)}
                      />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>
                </div>
                
                {assignment.description && (
                  <div className={`text-sm mb-3 p-3 rounded-xl border ${assignment.is_active ? 'text-zinc-600 bg-zinc-50 border-zinc-100' : 'text-zinc-400 bg-zinc-100/50 border-transparent'}`}>
                    {assignment.description}
                  </div>
                )}

                <div className={`flex flex-wrap gap-2 text-xs font-bold ${assignment.is_active ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  {assignment.requires_photo && (
                    <span className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-md">📷 Фото {assignment.requires_before_after ? 'ДО/ПОСЛЕ' : ''}</span>
                  )}
                  {assignment.assessment_type && assignment.assessment_type !== 'none' && (
                    <span className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-md">📝 Оценка: {assignment.assessment_type}</span>
                  )}
                  {assignment.medicine && (
                    <span className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-md">💊 {assignment.medicine}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <AssignmentModal
          elephants={elephants}
          initialData={editingAssignment}
          onClose={() => setModalOpen(false)}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
}

