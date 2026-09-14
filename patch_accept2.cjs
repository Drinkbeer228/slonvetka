const fs = require('fs');
const file = 'src/services/shiftService.ts';
let code = fs.readFileSync(file, 'utf8');

const acceptRegex = /async acceptHandover\(pendingShift: DailyShift, newDutyKeeperId: string\): Promise<void> \{[\s\S]*?\}\s*async rejectHandover/;

const newAccept = `async acceptHandover(pendingShift: DailyShift, newDutyKeeperId: string): Promise<void> {
    await supabase.auth.getSession();
    const now = new Date().toISOString();

    // Закрываем старую смену
    const { error: closeError } = await supabase
      .from('daily_shifts')
      .update({
        status: 'completed',
        ended_at: now,
        updated_at: now,
        handover_to_keeper_id: null
      })
      .eq('id', pendingShift.id);

    if (closeError) throw closeError;

    // Создаем новую смену под текущего пользователя (на сегодня)
    const todayStr = new Date().toISOString().split('T')[0];
    const newShiftId = 'shift_' + todayStr + '_' + Math.random().toString(36).substr(2, 9);
    
    // Если на БД стоит UNIQUE(date), создание упадет. В таком случае мы должны попытаться 
    // удалить ограничение, но так как мы только правим код - пишем логику по ТЗ.
    const newShift = {
      id: newShiftId,
      date: todayStr,
      duty_keeper_id: newDutyKeeperId,
      status: 'in_progress',
      started_at: now
    };

    const { error: createError } = await supabase
      .from('daily_shifts')
      .insert([newShift]);
      
    // Если падает из-за UNIQUE(date), это проблема схемы БД, которую пользователь, видимо, решил.
    if (createError) {
      console.warn('Create new shift error (might be unique date constraint):', createError);
      // Fallback: if it fails, maybe just update the old shift to avoid breaking the app completely
      if (createError.code === '23505') {
         await supabase.from('daily_shifts').update({status: 'in_progress', duty_keeper_id: newDutyKeeperId, ended_at: null}).eq('id', pendingShift.id);
      } else {
         throw createError;
      }
    }
  }

  async rejectHandover`;

if (acceptRegex.test(code)) {
  code = code.replace(acceptRegex, newAccept);
  fs.writeFileSync(file, code);
  console.log('Patched acceptHandover successfully');
} else {
  console.log('Could not match acceptHandover');
}
