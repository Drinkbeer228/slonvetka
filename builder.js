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
  UserCheck, Camera, Activity, AlertTriangle, ShieldAlert, LogOut, Check
} from 'lucide-react';
import { ShiftWheelModal } from '../components/daily-shift/ShiftWheelModal';

// ---------------------------------------------------------
// HOOKS
// ---------------------------------------------------------
function useScrollDirection(ref) {
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

`;
fs.writeFileSync(file, code);
