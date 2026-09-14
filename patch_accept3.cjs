const fs = require('fs');
const file = 'src/services/shiftService.ts';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const start = lines.findIndex(l => l.includes('async acceptHandover(pendingShift: DailyShift, newDutyKeeperId: string)'));
const end = lines.findIndex(l => l.includes('async rejectHandover('));

const newMethod = `  async acceptHandover(pendingShift: DailyShift, newDutyKeeperId: string): Promise<void> {
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

    // Пытаемся создать новую смену
    const newShiftId = \`shift_\${pendingShift.date}_\${Math.random().toString(36).substring(2, 9)}\`;
    const { error: createError } = await supabase
      .from('daily_shifts')
      .insert({
        id: newShiftId,
        date: pendingShift.date,
        duty_keeper_id: newDutyKeeperId,
        status: 'in_progress',
        started_at: now,
        updated_at: now
      });

    if (createError) {
      if (createError.code === '23505') {
        // Fallback: if UNIQUE(date) constraint exists in DB, we fallback to hijacking the current shift
        await supabase
          .from('daily_shifts')
          .update({
            status: 'in_progress',
            duty_keeper_id: newDutyKeeperId,
            ended_at: null
          })
          .eq('id', pendingShift.id);
      } else {
        throw createError;
      }
    }
  },`;

if (start !== -1 && end !== -1) {
  lines.splice(start, end - start, newMethod);
  fs.writeFileSync(file, lines.join('\n'));
  console.log('Patched acceptHandover successfully');
}
