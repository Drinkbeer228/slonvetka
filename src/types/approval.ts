export type ApprovalCategory =
  | 'workload_cancel'      // 🛑 Снять с репетиции / облегчить манежную нагрузку
  | 'medication_change'    // 💊 Согласовать смену дозировки / внеплановый препарат
  | 'ration_change'        // 🍎 Изменить рацион / доп. подкормка
  | 'emergency';           // 🚒 Внештатная ситуация / вызов специалиста

export interface ChiefApprovalRequest {
  id: string;
  shift_id?: string;
  elephant_id?: string;
  elephant_name?: string;
  requester_id: string;
  requester_name: string;
  category: ApprovalCategory;
  title: string;
  description?: string;
  photo_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  chief_comment?: string;
  created_at: string;
  resolved_at?: string;
}

export const APPROVAL_PRESETS: { category: ApprovalCategory; title: string; icon: string; description: string }[] = [
  {
    category: 'workload_cancel',
    title: 'Снять с дневной репетиции в манеже',
    icon: '🛑',
    description: 'Бережет ногу / вялость, освободить от трюковой нагрузки',
  },
  {
    category: 'medication_change',
    title: 'Внеплановая дача анальгетика / спазмолитика',
    icon: '💊',
    description: 'Симптомы дискомфорта / колики / болезненность',
  },
  {
    category: 'ration_change',
    title: 'Коррекция рациона (жидкая диета / доп. сочные)',
    icon: '🍎',
    description: 'Увеличение доли отрубей и семени льна, ограничение концентратов',
  },
  {
    category: 'emergency',
    title: 'Внештатная ситуация / Срочный консилиум',
    icon: '🚒',
    description: 'Подозрение на острую патологию, требуется личный осмотр шефа',
  },
];
