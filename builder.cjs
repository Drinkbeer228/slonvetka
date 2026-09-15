const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = `import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from '../store';
import { supabase } from '../lib/supabase';
import { shiftService } from '../services/shiftService';
import { SyncManager } from '../services/SyncManager';
import { DailyShift, ElephantDailyMetrics, FeedInventoryItem, createDefaultElephantMetrics } from '../types/shift';
import { Elephant, Assignment } from '../types';
import confetti from 'canvas-confetti';
import { 
  Calendar, Wifi, WifiOff, Menu, ClipboardList, Package, CircleDot, TreeDeciduous,
  UserCheck, Camera, Activity, AlertTriangle, ShieldAlert, LogOut, Check, ChevronDown, Plus, Minus, Users
} from 'lucide-react';
import { ShiftWheelModal } from '../components/daily-shift/ShiftWheelModal';

// ---------------------------------------------------------
// HOOKS
// ---------------------------------------------------------
function useScrollDirection(ref: React.RefObject<HTMLDivElement>) {
  const [direction, setDirection] = useState('up');
  const lastScrollY = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleScroll = () => {
      const currentScrollY = el.scrollTop;
      if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        setDirection('down');
      } else if (currentScrollY < lastScrollY.current) {
        setDirection('up');
      }
      lastScrollY.current = currentScrollY;
    };
    
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [ref]);
  
  return direction;
}

export function DailyShiftPage({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { profile, elephants, selectedDate, setSelectedDate } = useStore();
  const [shift, setShift] = useState<DailyShift | null>(null);
  const [metrics, setMetrics] = useState<Record<string, ElephantDailyMetrics>>({});
  const [ration, setRation] = useState<any>({});
  const [inventory, setInventory] = useState<any>({ bales: 42, rolls: 8, branches: 15 });
  const [events, setEvents] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [activeReel, setActiveReel] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollDir = useScrollDirection(containerRef);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

  // Reel 1 state
  const [physioTab, setPhysioTab] = useState<'poop'|'urine'|'sleep'>('poop');
  
  // Initialize and dummy online listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Intersection observer for active reel
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveReel(Number(entry.target.getAttribute('data-index')));
          }
        });
      },
      { root: containerRef.current, threshold: 0.5 }
    );
    const reels = containerRef.current.querySelectorAll('.reel-section');
    reels.forEach(r => observer.observe(r));
    return () => observer.disconnect();
  }, [shift]);

  // Load shift mock or actual
  useEffect(() => {
    const loadShift = async () => {
      if (!profile) return;
      const today = new Date().toISOString().split('T')[0];
      setShift({
        id: 'shift-1',
        date: selectedDate || today,
        status: 'in_progress',
        started_at: new Date().toISOString(),
        duty_keeper_id: profile.id,
        hay_bags_distributed: 0,
        hay_bales_distributed: 0,
        reminders: [],
        feed_notes: '',
        handover_notes: ''
      });
      setMetrics({
        'margo': createDefaultElephantMetrics('shift-1', 'margo'),
        'audrey': createDefaultElephantMetrics('shift-1', 'audrey'),
        'pretty': createDefaultElephantMetrics('shift-1', 'pretty')
      });
      setEvents([]);
    };
    loadShift();
  }, [selectedDate, profile]);

  const addEvent = (title: string) => {
    setEvents(prev => [{ time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), title }, ...prev]);
    if(navigator.vibrate) navigator.vibrate(50);
  };

  const handleHandover = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };
`;
fs.writeFileSync(file, code);
