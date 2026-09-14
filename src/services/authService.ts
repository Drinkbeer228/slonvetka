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
        console.warn('RPC register_device_session error, falling back to direct update:', rpcError);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ current_session_id: sessionToken })
          .eq('id', userId);
          
        if (updateError) {
          console.error('Failed to update session token:', updateError);
        }
      }
    } catch (err) {
      console.error('Error registering device session:', err);
    }
  },

  async verifyDeviceSession(userId: string, localToken: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('current_session_id')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error('Error verifying device session:', error);
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
      console.error('Error in verifyDeviceSession:', err);
      return true;
    }
  }
};
