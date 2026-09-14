import { useState, useEffect, useCallback } from 'react';

export interface ShiftEvent {
  id: string;
  shift_id: string;
  timestamp: number;
  keeper_id: string;
  keeper_name: string;
  action_title: string;
  icon: string;
  undo_payload?: {
    type: string;
    elephant_id?: string;
    field?: string;
    value?: number;
    record_id?: string;
    assignment_id?: string;
  };
}

export function useShiftEvents(shiftId: string | null) {
  const [events, setEvents] = useState<ShiftEvent[]>([]);

  useEffect(() => {
    if (!shiftId) {
      setEvents([]);
      return;
    }
    
    // We want to poll for changes in case multiple tabs are open or we just want to ensure it's fresh
    // But since it's local, we can just load it once and update state.
    // However, if we need it to be "real-time" across components, we can dispatch a custom event.
    const loadEvents = () => {
      try {
        const saved = localStorage.getItem(`shift_events_${shiftId}`);
        if (saved) {
          setEvents(JSON.parse(saved));
        } else {
          setEvents([]);
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    loadEvents();
    
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `shift_events_${shiftId}`) {
        loadEvents();
      }
    };
    
    const handleLocalUpdate = () => loadEvents();
    
    window.addEventListener('storage', handleStorage);
    window.addEventListener(`shift_events_updated_${shiftId}`, handleLocalUpdate);
    
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(`shift_events_updated_${shiftId}`, handleLocalUpdate);
    };
  }, [shiftId]);

  const addEvent = useCallback((event: Omit<ShiftEvent, 'id' | 'shift_id' | 'timestamp'>) => {
    if (!shiftId) return;
    
    const newEvent: ShiftEvent = {
      ...event,
      id: Math.random().toString(36).substring(2, 9),
      shift_id: shiftId,
      timestamp: Date.now(),
    };
    
    setEvents(prev => {
      const updated = [newEvent, ...prev].slice(0, 100); // Keep last 100 events
      try {
        localStorage.setItem(`shift_events_${shiftId}`, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(`shift_events_updated_${shiftId}`));
      } catch {}
      return updated;
    });
  }, [shiftId]);

  const removeEvent = useCallback((eventId: string) => {
    if (!shiftId) return;
    setEvents(prev => {
      const updated = prev.filter(e => e.id !== eventId);
      try {
        localStorage.setItem(`shift_events_${shiftId}`, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent(`shift_events_updated_${shiftId}`));
      } catch {}
      return updated;
    });
  }, [shiftId]);

  return { events, addEvent, removeEvent };
}
