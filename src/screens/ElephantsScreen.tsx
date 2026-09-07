import React, { useState } from 'react';
import { useStore } from '../store';
import { ChevronRight, Plus } from 'lucide-react';
import { AssignmentModal } from '../components/AssignmentModal';
import { Assignment } from '../types';

interface ElephantsScreenProps {
  onElephantClick: (id: string) => void;
}

export function ElephantsScreen({ onElephantClick }: ElephantsScreenProps) {
  const { elephants, profile } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedElephantIdForModal, setSelectedElephantIdForModal] = useState<string>('');

  const handleOpenModal = (e: React.MouseEvent, elephantId: string) => {
    e.stopPropagation();
    setSelectedElephantIdForModal(elephantId);
    setModalOpen(true);
  };

  return (
    <div className="pb-8 space-y-6 mt-4">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-tight">Слоны</h1>
        <p className="text-zinc-500 font-medium text-sm mt-1">Карточки и история процедур</p>
      </div>

      <div className="space-y-4">
        {elephants.map(elephant => (
          <div
            key={elephant.id}
            onClick={() => onElephantClick(elephant.id)}
            className="w-full bg-white rounded-3xl p-5 shadow-sm border border-zinc-200 cursor-pointer hover:border-zinc-400 transition"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-black">{elephant.name}</h2>
                <div className="text-sm font-medium text-zinc-500 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Активен
                </div>
              </div>
              <ChevronRight className="text-zinc-400" />
            </div>
            
            {profile?.role === 'vet' && (
              <button
                onClick={(e) => handleOpenModal(e, elephant.id)}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-2 rounded-xl flex items-center justify-center gap-1.5 transition text-sm border border-blue-100"
              >
                <Plus size={16} />
                <span>Добавить задачу</span>
              </button>
            )}
          </div>
        ))}
      </div>

      {modalOpen && (
        <AssignmentModal
          elephants={elephants}
          initialData={
            selectedElephantIdForModal 
              ? { elephant_id: selectedElephantIdForModal } as Assignment 
              : null
          }
          onClose={() => setModalOpen(false)}
          onSaved={() => setModalOpen(false)}
        />
      )}
    </div>
  );
}

