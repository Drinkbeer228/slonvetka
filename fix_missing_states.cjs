const fs = require('fs');
const file = 'src/screens/DailyShiftPage.tsx';

let code = fs.readFileSync(file, 'utf8');

const stateInsert = `  const [hayWatered, setHayWatered] = useState(false);
  const [porridgeBrewTime, setPorridgeBrewTime] = useState<string | null>(null);
  const [isAfterArena, setIsAfterArena] = useState(false);
  const [feedStatus, setFeedStatus] = useState<Record<string, string>>({ m: 'clean', n: 'clean', e: 'clean' });
  const [washedAll, setWashedAll] = useState(false);
  const [carpetsCleaned, setCarpetsCleaned] = useState(false);
  const [washParts, setWashParts] = useState<string[]>([]);
  const [activeVetTab, setActiveVetTab] = useState('margo');
  const [stereotypies, setStereotypies] = useState<Record<string, string[]>>({ margo: [], audrey: [], pretty: [] });
  const [lameness, setLameness] = useState<Record<string, boolean>>({ margo: false, audrey: false, pretty: false });
  const [incidents, setIncidents] = useState<string[]>([]);`;

code = code.replace(/  const \[hayWatered, setHayWatered\] = useState\(false\);/, stateInsert);

fs.writeFileSync(file, code);
