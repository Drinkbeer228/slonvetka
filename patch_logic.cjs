const fs = require('fs');
let code = fs.readFileSync('src/screens/DailyShiftPage.tsx', 'utf-8');

const regexStates = /const \[activeSeasonals.*?return;/s;

const newStates = `const [activeSeasonals, setActiveSeasonals] = useState<string[]>([]);
  const [dispensedSlots, setDispensedSlots] = useState<Record<string, boolean>>({});
  
  const handleDispense = (slotId: string, recipeKey: string, isEvening: boolean, seasonals: string[]) => {
    if (dispensedSlots[slotId]) return;
    
    // Decrement from fodderInventory (updateFodderAmount takes id and delta)
    let logMsg = '';
    
    if (slotId === 'm') {
      if (recipeKey === 'classic_m') { updateFodderAmount('c1', -0.5); updateFodderAmount('c2', -0.3); logMsg = "списано: 0.5 меш овса, 0.3 меш отрубей"; }
      if (recipeKey === 'diet_m') { updateFodderAmount('c4', -0.2); updateFodderAmount('c3', -0.3); logMsg = "списано: 0.2 меш льна, 0.3 меш ВТМ"; }
      if (recipeKey === 'energy_m') { updateFodderAmount('c1', -0.5); updateFodderAmount('c5', -0.5); logMsg = "списано: 0.5 меш овса, 0.5 меш ячменя"; }
    } else if (slotId === 'n') {
      if (recipeKey === 'classic_n') { updateFodderAmount('c3', -0.2); updateFodderAmount('c4', -0.1); logMsg = "списано: 0.2 меш ВТМ, 0.1 меш льна"; }
      if (recipeKey === 'diet_n') { updateFodderAmount('c4', -0.2); logMsg = "списано: 0.2 меш льна"; }
    } else if (isEvening) {
      updateFodderAmount('j1', -15);
      updateFodderAmount('j2', -10);
      updateFodderAmount('j3', -5);
      logMsg = "списано: 15кг моркови, 10кг свёклы, 5кг яблок";
      if (seasonals.includes('🎃 Тыква')) { updateFodderAmount('j4', -5); logMsg += ", 5кг тыквы"; }
    }
    
    const slotMap: any = { m: 'Утренняя запарка', n: 'Обеденный мэш', e: 'Вечерний салат' };
    const recipeNameMap: any = {
      'classic_m': 'Стандарт', 'diet_m': 'Диета', 'energy_m': 'Зима/Энергия',
      'classic_n': 'Мэш с ВТМ', 'diet_n': 'Легкий отвар'
    };
    
    let eventTitle = slotMap[slotId] + ': выдан рацион';
    if (!isEvening) {
      eventTitle += " '" + (recipeNameMap[recipeKey] || 'Базовый') + "'";
    }
    if (logMsg) eventTitle += ", " + logMsg;
    
    addEvent(eventTitle);
    setDispensedSlots(p => ({...p, [slotId]: true}));
  };
  
  const submitDietProblem = () => {
    if (!openProblemSlot || !problemForm.reason) return;`;

code = code.replace(regexStates, newStates);
fs.writeFileSync('src/screens/DailyShiftPage.tsx', code);
console.log('Logic patched.');
