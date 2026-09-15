const fs = require('fs');
let code = fs.readFileSync('src/components/daily-shift/FeedControl.tsx', 'utf8');

// Replace the first few lines to remove the bad import and define the interface
code = code.replace(/import \{ DailyRationData \} from '\.\/FeedControl';[\s\S]*?(?=export interface FeedControlProps)/, 
`export interface DailyRationData {
  morning_porridge?: 'none' | 'all' | 'partial' | 'refused';
  morning_porridge_time?: string | null;
  morning_porridge_keeper?: string | null;
  morning_porridge_photo?: string | null;
  evening_salad_chips: string[];
  salad_notes: string;
  coarse_branches?: number;
  salad_base_included?: boolean;
  salad_photo_url?: string;
  salad_appetite?: 'all' | 'partial' | 'refused' | null;
  salad_base_time?: string | null;
  morning_mash_fed?: boolean;
  morning_mash_time?: string | null;
  is_show_day?: boolean;
  noon_mash_status?: 'pending' | 'fed' | 'skipped_show_day';
  noon_mash_cooldown_confirmed?: boolean;
  noon_mash_time?: string | null;
  noon_mash_appetite?: 'all' | 'partial' | 'refused' | null;
  evening_diet_fed?: boolean;
  evening_diet_time?: string | null;
}

`);

// Also add dutyKeeperName, etc to FeedControlProps
code = code.replace(/export interface FeedControlProps \{[\s\S]*?\}/, 
`export interface FeedControlProps {
  ration: DailyRationData;
  isLocked?: boolean;
  onPorridgeFieldChange: (field: keyof DailyRationData | Partial<DailyRationData>, value?: any) => void;
  dutyKeeperName?: string;
  hayBalesDistributed?: number;
  hayBagsDistributed?: number;
  onBalesChange?: (val: number) => void;
  onBagsChange?: (val: number) => void;
  onVegetableToggle?: (chip: string) => void;
  onSaladNotesChange?: (notes: string) => void;
  onBranchesChange?: (val: number) => void;
  onSaladBaseToggle?: (included: boolean) => void;
  onSaladPhotoChange?: (photoUrl?: string) => void;
}`);

fs.writeFileSync('src/components/daily-shift/FeedControl.tsx', code);
