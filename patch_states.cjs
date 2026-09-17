const fs = require('fs');
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf-8');

const oldStates = `  const [mashBaseIngredients, setMashBaseIngredients] = useState<string[]>([]);
  const [mashPhytoAdditives, setMashPhytoAdditives] = useState<string[]>([]);
  const [feedStatus, setFeedStatus] = useState<Record<string, string>>({ m: 'clean', n: 'clean', e: 'clean' });
  const [wateringSlots, setWateringSlots] = useState<Record<string, any>>({});

  const toggleMash = (arr: string[], setArr: any, item: string) => {
    setArr(arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]);
  };`;

const newStates = `  const [dietProblems, setDietProblems] = useState<{slotId: string, elephant: string, reason: string}[]>([]);
  const [openProblemSlot, setOpenProblemSlot] = useState<string | null>(null);
  const [problemForm, setProblemForm] = useState({ elephant: 'margo', reason: '' });
  
  const submitDietProblem = () => {
    if (!openProblemSlot || !problemForm.reason) return;
    
    setDietProblems(prev => [...prev, {
      slotId: openProblemSlot,
      elephant: problemForm.elephant,
      reason: problemForm.reason
    }]);
    
    const eleMap: any = { margo: 'Марго', audrey: 'Одри', pretty: 'Прэтти' };
    const slotMap: any = { m: 'Утро', n: 'Обед', e: 'Вечер' };
    
    addEvent(slotMap[openProblemSlot] + ' • ' + eleMap[problemForm.elephant] + ' — ' + problemForm.reason);
    
    setOpenProblemSlot(null);
    setProblemForm({ elephant: 'margo', reason: '' });
  };`;

code = code.replace(oldStates, newStates);
fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
console.log('States replaced.');
