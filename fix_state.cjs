const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

if (!code.includes('porridgeBrewTime')) {
    code = code.replace(
      /const \[hayWatered, setHayWatered\] = useState\(false\);/,
      `const [hayWatered, setHayWatered] = useState(false);
  const [porridgeBrewTime, setPorridgeBrewTime] = useState<string | null>(null);
  const [isAfterArena, setIsAfterArena] = useState(false);
  const [feedStatus, setFeedStatus] = useState<Record<string, string>>({ m: 'clean', n: 'clean', e: 'clean' });`
    );
    fs.writeFileSync(file, code);
}

