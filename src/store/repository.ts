import { Elephant, Keeper, Assignment, TreatmentRecord } from '../types';

export const DEFAULT_ELEPHANTS: Elephant[] = [
  { id: 'el-1', name: 'Прэтти', active: true },
  { id: 'el-2', name: 'Марго', active: true },
  { id: 'el-3', name: 'Одри', active: true }
];

export const DEFAULT_KEEPERS: Keeper[] = [
  { id: 'kp-1', name: 'Иван', active: true },
  { id: 'kp-2', name: 'Сергей', active: true },
  { id: 'kp-3', name: 'Алексей', active: true }
];

export const DEFAULT_ASSIGNMENTS: Assignment[] = [
  {
    id: 'as-1',
    elephantId: 'el-1',
    title: 'Капать глаза',
    description: 'Закапать оба глаза согласно назначению',
    schedule: 'daily',
    active: true,
    requiresPhoto: true,
    requiresBeforeAfter: false,
    assessmentType: 'normal_or_issue',
    customFields: []
  },
  {
    id: 'as-2',
    elephantId: 'el-1',
    title: 'Обработка височных желез',
    description: 'Обработать височные доли назначенным средством',
    schedule: 'daily',
    active: true,
    requiresPhoto: true,
    requiresBeforeAfter: false,
    assessmentType: 'normal_or_issue',
    customFields: ['Препарат']
  },
  {
    id: 'as-3',
    elephantId: 'el-1',
    title: 'Контроль подошвы и ногтей',
    description: 'Сделать фотографии ногтей и подошвы. Оценить состояние роговой части.',
    schedule: 'weekly',
    active: true,
    requiresPhoto: true,
    requiresBeforeAfter: false,
    assessmentType: 'needs_cleaning',
    customFields: []
  },
  {
    id: 'as-4',
    elephantId: 'el-1',
    title: 'Чистка подошвы',
    description: 'По необходимости',
    schedule: 'as_needed',
    active: true,
    requiresPhoto: true,
    requiresBeforeAfter: true,
    assessmentType: 'none',
    customFields: ['Инструмент/Средство']
  },
  {
    id: 'as-5',
    elephantId: 'el-2',
    title: 'Контроль подошвы и ногтей',
    description: 'Сделать фотографии ногтей и подошвы',
    schedule: 'weekly',
    active: true,
    requiresPhoto: true,
    requiresBeforeAfter: false,
    assessmentType: 'needs_cleaning',
    customFields: []
  },
  {
    id: 'as-6',
    elephantId: 'el-3',
    title: 'Контроль подошвы и ногтей',
    description: 'Сделать фотографии ногтей и подошвы',
    schedule: 'weekly',
    active: true,
    requiresPhoto: true,
    requiresBeforeAfter: false,
    assessmentType: 'needs_cleaning',
    customFields: []
  }
];

export interface AppState {
  elephants: Elephant[];
  keepers: Keeper[];
  assignments: Assignment[];
  records: TreatmentRecord[];
  activeKeeperId: string | null;
}

const STORAGE_KEY = 'vet_elephant_v2';

export class LocalRepository {
  private state: AppState;

  constructor() {
    this.state = this.load();
  }

  private load(): AppState {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.error('Failed to parse local storage', e);
      }
    }
    
    return {
      elephants: [...DEFAULT_ELEPHANTS],
      keepers: [...DEFAULT_KEEPERS],
      assignments: [...DEFAULT_ASSIGNMENTS],
      records: [],
      activeKeeperId: null
    };
  }

  private save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
  }

  getState() {
    return this.state;
  }

  setActiveKeeper(id: string | null) {
    this.state.activeKeeperId = id;
    this.save();
  }

  addRecord(record: TreatmentRecord) {
    this.state.records.push(record);
    this.save();
  }

  addAssignment(assignment: Assignment) {
    this.state.assignments.push(assignment);
    this.save();
  }

  updateAssignment(assignment: Assignment) {
    const idx = this.state.assignments.findIndex(a => a.id === assignment.id);
    if (idx !== -1) {
      this.state.assignments[idx] = assignment;
      this.save();
    }
  }
  
  deleteAssignment(id: string) {
    this.state.assignments = this.state.assignments.filter(a => a.id !== id);
    this.save();
  }
  
  deleteRecord(id: string) {
    this.state.records = this.state.records.filter(r => r.id !== id);
    this.save();
  }
}

export const repository = new LocalRepository();
