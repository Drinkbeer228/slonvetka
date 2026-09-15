const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = `
export function DailyShiftPage({ onNavigate }: { onNavigate: (screen: string) => void }) {
  const { profile, elephants, selectedDate, setSelectedDate } = useStore();
  const [shift, setShift] = useState<DailyShift | null>(null);
  const [metrics, setMetrics] = useState<Record<string, ElephantDailyMetrics>>({});
  const [ration, setRation] = useState<any>({});
  const [inventory, setInventory] = useState<any>({});
  const [counters, setCounters] = useState<any>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const [activeReel, setActiveReel] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollDir = useScrollDirection(containerRef);
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [wheelOpen, setWheelOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);

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
  }, [shift]); // re-run when shift loads to ensure elements exist

  // Load shift mock or actual
  useEffect(() => {
    const loadShift = async () => {
      // Mocked load for UI demonstration based on zero-keyboard UI
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
    setEvents(prev => [...prev, { time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), title }]);
    if(navigator.vibrate) navigator.vibrate(50);
  };

  const handleHandover = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    // close shift logic
  };

`;
fs.appendFileSync(file, code);
