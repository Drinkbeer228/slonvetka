import React, { useState, useEffect, useRef } from 'react';
import { X, Check, RefreshCw, Trophy, Edit3, Plus, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Participant {
  id: string;
  name: string;
  active: boolean;
}

const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: '1', name: 'Тимофей', active: true },
  { id: '2', name: 'Димон', active: true },
  { id: '3', name: 'Витёк', active: true },
  { id: '4', name: 'Коля', active: true },
];

const QUICK_TASKS = [
  '🧼 Кто моет ковры?',
  '🚜 Кто вывозит тачки?',
  '🌾 Кто лезет за тюками на сеновал?',
  '🚿 Кто замывает слоних (ноги/круп)?',
  '☕ Кто ставит чайник?',
];

const COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', 
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'
];

interface ShiftWheelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogResult?: (winner: string, task: string) => void;
}

export function ShiftWheelModal({ isOpen, onClose, onLogResult }: ShiftWheelModalProps) {
  const [participants, setParticipants] = useState<Participant[]>(DEFAULT_PARTICIPANTS);
  const [newParticipantName, setNewParticipantName] = useState('');
  
  const [selectedTask, setSelectedTask] = useState<string>(QUICK_TASKS[0]);
  const [customTask, setCustomTask] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<Participant | null>(null);
  const wheelRef = useRef<SVGSVGElement>(null);

  const activeParticipants = participants.filter(p => p.active);

  // Close effect & Reset
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setWinner(null);
        setRotation(0);
      }, 300);
    }
  }, [isOpen]);

  const handleToggleParticipant = (id: string) => {
    if (isSpinning) return;
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const handleRemoveParticipant = (id: string) => {
    if (isSpinning) return;
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleAddParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipantName.trim() || isSpinning) return;
    setParticipants(prev => [
      ...prev, 
      { id: Date.now().toString(), name: newParticipantName.trim(), active: true }
    ]);
    setNewParticipantName('');
  };

  const spin = () => {
    if (activeParticipants.length < 2) return; 
    if (isSpinning) return;
    
    // Vibrate on start
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate(15); } catch(e){}
    }

    setIsSpinning(true);
    setWinner(null);

    const N = activeParticipants.length;
    const sliceAngle = 360 / N;
    
    // Pick random winner
    const winnerIndex = Math.floor(Math.random() * N);
    
    // Calculate angle to stop at (we want the winner's slice midpoint to align with TOP)
    const midpoint = (winnerIndex + 0.5) * sliceAngle;
    
    // Random offset within the slice so it doesn't look staged (avoiding edges)
    const randomOffset = (Math.random() - 0.5) * (sliceAngle * 0.7); 
    const finalStopAngle = 360 - (midpoint + randomOffset);

    // Add multiple spins (e.g., 6 full rotations)
    const extraSpins = 360 * 6;
    
    // Current base rotation
    const currentBase = Math.floor(rotation / 360) * 360;
    
    const targetRotation = currentBase + extraSpins + finalStopAngle;
    setRotation(targetRotation);

    // Finish spin
    setTimeout(() => {
      setIsSpinning(false);
      setWinner(activeParticipants[winnerIndex]);
      
      // Haptics & Confetti
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
         try { navigator.vibrate([30, 50, 30, 50, 50]); } catch(e){}
      }
      
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#ef4444', '#10b981', '#3b82f6'],
        zIndex: 1000
      });
      
    }, 4000); // matches CSS transition duration
  };

  const currentTaskString = isCustomMode ? customTask : selectedTask;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !isSpinning && onClose()} />
      
      <div className="relative w-full max-w-md bg-white sm:rounded-[32px] rounded-t-[32px] h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Trophy className="text-amber-500" size={24} />
            Жребий смены
          </h2>
          <button 
            onClick={onClose}
            disabled={isSpinning}
            className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-95 disabled:opacity-50 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Scroll */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
          
          {/* Tasks Section */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Что разыгрываем?</h3>
            <div className="flex flex-wrap gap-2">
              {QUICK_TASKS.map(task => (
                <button
                  key={task}
                  disabled={isSpinning}
                  onClick={() => {
                    setIsCustomMode(false);
                    setSelectedTask(task);
                  }}
                  className={`px-3 py-2 rounded-[16px] text-sm font-bold transition-all active:scale-95 text-left border ${
                    !isCustomMode && selectedTask === task 
                      ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {task}
                </button>
              ))}
              <button
                  disabled={isSpinning}
                  onClick={() => setIsCustomMode(true)}
                  className={`px-3 py-2 rounded-[16px] text-sm font-bold transition-all active:scale-95 text-left border flex items-center gap-1.5 ${
                    isCustomMode
                      ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-sm' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Edit3 size={16} /> Свой вариант
              </button>
            </div>
            
            {isCustomMode && (
              <div className="mt-2 animate-in fade-in zoom-in-95">
                <input 
                  type="text"
                  placeholder="Например: Кто идет за кофе?"
                  value={customTask}
                  onChange={(e) => setCustomTask(e.target.value)}
                  disabled={isSpinning}
                  className="w-full min-h-[48px] px-4 rounded-[16px] bg-slate-50 border border-slate-200 text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow"
                />
              </div>
            )}
          </div>

          {/* Participants Section */}
          <div className="flex flex-col gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">Участники ({activeParticipants.length})</h3>
            <div className="flex flex-wrap gap-2">
              {participants.map(p => (
                <div 
                  key={p.id}
                  className={`flex items-center rounded-[16px] border transition-all ${
                    p.active ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <button 
                    disabled={isSpinning}
                    onClick={() => handleToggleParticipant(p.id)}
                    className="flex items-center gap-2 px-3 py-2.5 outline-none active:scale-95 transition-transform"
                  >
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      p.active ? 'bg-emerald-500 border-emerald-600 text-white' : 'bg-white border-slate-300'
                    }`}>
                      {p.active && <Check size={14} strokeWidth={3} />}
                    </div>
                    <span className={`text-sm font-bold ${p.active ? 'text-emerald-900' : 'text-slate-500 line-through decoration-slate-400/50'}`}>
                      {p.name}
                    </span>
                  </button>
                  {/* Remove btn */}
                  {!DEFAULT_PARTICIPANTS.find(d => d.id === p.id) && (
                    <button 
                      onClick={() => handleRemoveParticipant(p.id)}
                      disabled={isSpinning}
                      className="pr-3 pl-1 py-2.5 text-slate-400 hover:text-rose-500 active:scale-95 transition-transform"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <form onSubmit={handleAddParticipant} className="flex items-center gap-2 mt-1">
              <input 
                type="text"
                placeholder="Новое имя..."
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                disabled={isSpinning}
                className="flex-1 min-h-[44px] px-4 rounded-[16px] bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-400 transition-shadow"
              />
              <button 
                type="submit"
                disabled={!newParticipantName.trim() || isSpinning}
                className="min-h-[44px] min-w-[44px] rounded-[16px] bg-slate-800 text-white flex items-center justify-center disabled:opacity-50 active:scale-95 transition-all"
              >
                <Plus size={20} />
              </button>
            </form>
          </div>

          {/* Wheel Area */}
          <div className="relative flex flex-col items-center justify-center py-6 mt-2">
            
            {/* The Pointer (Arrow) */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-8 h-10 drop-shadow-md flex flex-col items-center justify-start">
              <div className="w-6 h-6 bg-rose-500 rounded-full border-4 border-white shadow-sm flex-shrink-0 z-10" />
              <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-rose-500 -mt-2 z-0" />
            </div>

            {/* The Wheel */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full shadow-2xl border-4 border-slate-800 bg-slate-100 overflow-hidden shrink-0">
              {activeParticipants.length > 0 ? (
                <svg 
                  ref={wheelRef}
                  viewBox="-100 -100 200 200" 
                  className="w-full h-full -rotate-90 origin-center"
                  style={{
                    transform: `rotate(${-90 + rotation}deg)`,
                    transition: isSpinning ? 'transform 4s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none'
                  }}
                >
                  {activeParticipants.map((p, i) => {
                    const N = activeParticipants.length;
                    const sliceAngle = 360 / N;
                    
                    if (N === 1) {
                      return (
                        <g key={p.id}>
                          <circle cx="0" cy="0" r="100" fill={COLORS[0]} />
                          <text x="0" y="0" fill="white" fontSize="16" fontWeight="900" textAnchor="middle" alignmentBaseline="middle" transform="rotate(90)">
                            {p.name}
                          </text>
                        </g>
                      );
                    }

                    const start = (i * sliceAngle * Math.PI) / 180;
                    const end = ((i + 1) * sliceAngle * Math.PI) / 180;
                    const x1 = Math.cos(start) * 100;
                    const y1 = Math.sin(start) * 100;
                    const x2 = Math.cos(end) * 100;
                    const y2 = Math.sin(end) * 100;
                    const largeArc = sliceAngle > 180 ? 1 : 0;
                    const pathData = `M 0 0 L ${x1} ${y1} A 100 100 0 ${largeArc} 1 ${x2} ${y2} Z`;
                    
                    const midAngle = (i + 0.5) * sliceAngle;
                    
                    return (
                      <g key={p.id}>
                        <path d={pathData} fill={COLORS[i % COLORS.length]} stroke="white" strokeWidth="1.5" />
                        <g transform={`rotate(${midAngle}) translate(55, 0)`}>
                          <text
                            fill="white"
                            fontSize={N > 6 ? "10" : "13"}
                            fontWeight="900"
                            textAnchor="middle"
                            alignmentBaseline="middle"
                            className="drop-shadow-md uppercase tracking-wider"
                          >
                            {p.name}
                          </text>
                        </g>
                      </g>
                    )
                  })}
                  {/* Center Hub */}
                  <circle cx="0" cy="0" r="12" fill="white" className="drop-shadow-md" />
                  <circle cx="0" cy="0" r="4" fill="#334155" />
                </svg>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-center p-4 text-slate-400 font-bold text-sm">
                  Выберите участников для розыгрыша
                </div>
              )}
              
              {/* Winner Overlay (Displays over the wheel after spin) */}
              {winner && !isSpinning && (
                <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-90 duration-300">
                  <div className="text-center flex flex-col items-center">
                    <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3 shadow-inner">
                      <Trophy size={32} />
                    </div>
                    <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">Победитель</div>
                    <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                      {winner.name}!
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Task Result Block */}
            {winner && !isSpinning && (
               <div className="w-full max-w-[260px] mt-6 bg-amber-50 border border-amber-200 rounded-[20px] p-4 text-center animate-in slide-in-from-bottom-4 fade-in duration-500 shadow-sm">
                 <div className="text-[10px] text-amber-700/70 font-black uppercase mb-1 tracking-widest">Выпавшая задача</div>
                 <div className="text-amber-950 font-black text-sm leading-tight">{currentTaskString || 'Не указана'}</div>
               </div>
            )}
            
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 p-4 border-t border-slate-100 flex flex-col gap-3 bg-white pb-[env(safe-area-inset-bottom,1rem)]">
          {winner && !isSpinning ? (
            <div className="flex gap-2">
               <button 
                onClick={() => {
                  setWinner(null);
                  spin();
                }}
                className="min-w-[64px] min-h-[52px] rounded-[20px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm"
               >
                 <RefreshCw size={20} />
               </button>
               <button 
                onClick={() => {
                  onLogResult?.(winner.name, currentTaskString);
                  onClose();
                }}
                className="flex-1 min-h-[52px] rounded-[20px] bg-emerald-500 hover:bg-emerald-600 text-white font-black flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/30"
               >
                 <Check size={20} /> Зафиксировать
               </button>
            </div>
          ) : (
            <button 
              disabled={isSpinning || activeParticipants.length < 2 || (isCustomMode && !customTask.trim())}
              onClick={spin}
              className="w-full min-h-[52px] rounded-[20px] bg-amber-500 hover:bg-amber-600 text-white font-black text-lg flex items-center justify-center uppercase tracking-wider active:scale-[0.98] transition-all disabled:opacity-50 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed shadow-lg shadow-amber-500/30"
            >
              {isSpinning ? 'Крутится...' : 'Крутить жребий'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
