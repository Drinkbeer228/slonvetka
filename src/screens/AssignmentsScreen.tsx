import React, { useState } from 'react';
import { useStore } from '../store';
import { Assignment } from '../types';

export function AssignmentsScreen() {
  const { assignments, elephants } = useStore();
  const [selectedElephantId, setSelectedElephantId] = useState<string>('all');

  const filteredAssignments = selectedElephantId === 'all' 
    ? assignments 
    : assignments.filter(a => a.elephantId === selectedElephantId);

  return (
    <div className="pb-8 space-y-6 mt-4">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Назначения</h1>
          <p className="text-zinc-500 font-medium text-sm mt-1">Редактор для ветврача</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setSelectedElephantId('all')}
          className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition border-2 ${selectedElephantId === 'all' ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}
        >
          Все слоны
        </button>
        {elephants.map(el => (
          <button
            key={el.id}
            onClick={() => setSelectedElephantId(el.id)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition border-2 ${selectedElephantId === el.id ? 'bg-zinc-900 border-zinc-900 text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-400'}`}
          >
            {el.name}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filteredAssignments.map(assignment => {
          const elephant = elephants.find(e => e.id === assignment.elephantId);
          return (
            <div key={assignment.id} className={`bg-white rounded-2xl p-4 shadow-sm border-2 ${assignment.active ? 'border-zinc-200' : 'border-zinc-200 opacity-60'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="font-bold text-lg leading-tight text-zinc-900">{assignment.title}</div>
                <div className="text-xs font-bold px-2 py-1 bg-zinc-100 rounded-md ml-3 whitespace-nowrap">
                  {assignment.schedule}
                </div>
              </div>
              
              <div className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase inline-block mb-3">
                {elephant?.name}
              </div>

              {assignment.description && (
                <div className="text-sm text-zinc-600 mb-3 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                  {assignment.description}
                </div>
              )}

              <div className="flex flex-wrap gap-2 text-xs font-bold text-zinc-500">
                {assignment.requiresPhoto && (
                  <span className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-md">📷 Обязательное фото</span>
                )}
                {assignment.assessmentType !== 'none' && (
                  <span className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-md">📝 Требует оценки</span>
                )}
                {assignment.customFields.map(f => (
                  <span key={f} className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-md">✏️ {f}</span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* 
        NOTE: MVP currently does not include full Assignment Editor to keep scope small.
        Can be added based on further user requests.
      */}
    </div>
  );
}
