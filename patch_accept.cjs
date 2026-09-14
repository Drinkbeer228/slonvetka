const fs = require('fs');
const file = 'src/services/shiftService.ts';
let code = fs.readFileSync(file, 'utf8');

const acceptRegex = /async acceptHandover\([\s\S]*?\n  \}/;

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

    // Создаем новую смену под текущего пользователя (будет выполнено через getOrCreateShift на клиенте, 
    // либо мы можем создать её прямо здесь)
    // Но так как у нас в БД может быть ограничение UNIQUE(date), создание новой смены на ту же дату 
    // может упасть. Мы попытаемся её создать с другой датой или оставим создание getOrCreateShift.
    // Если клиент делает reload, он вызовет getOrCreateShift.
  }`;

// Actually, I should just modify `acceptHandover` to close the old one, and then on the frontend reload to create a new one, or create it right here.
