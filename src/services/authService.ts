import { supabase } from '../lib/supabase';
import { Profile } from '../types';

export const authService = {
  async registerDeviceSession(userId: string, sessionToken: string): Promise<void> {
    try {
      // Пытаемся вызвать RPC как сказано в задаче
      const { error: rpcError } = await supabase.rpc('register_device_session', { 
        user_id: userId, 
        session_token: sessionToken 
      });
      
      // Если RPC не существует (схема еще не обновлена в Supabase), используем прямой update (разрешено через RLS)
      if (rpcError) {
        console.warn('RPC register_device_session notice, falling back to direct update:', rpcError.message || rpcError);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ current_session_id: sessionToken })
          .eq('id', userId);
          
        if (updateError) {
          console.warn('Notice updating session token:', updateError.message || updateError);
        }
      }
    } catch (err) {
      console.warn('Network notice registering device session:', err);
    }
  },

  async verifyDeviceSession(userId: string, localToken: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('current_session_id')
        .eq('id', userId)
        .maybeSingle();
        
      if (error) {
        console.warn('Notice verifying device session (offline/unreachable):', error.message || error);
        return true; // В случае ошибки сети не выбрасываем пользователя
      }
      
      if (!data) return false;
      
      // Если в базе нет токена (например, старая сессия), или он совпадает - ок
      // Если токен в базе есть и он НЕ совпадает с локальным - сессия перехвачена
      if (data.current_session_id && data.current_session_id !== localToken) {
        return false;
      }
      
      return true;
    } catch (err) {
      console.warn('Notice in verifyDeviceSession (offline/unreachable):', err);
      return true;
    }
  }
};
