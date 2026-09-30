import { useState, useEffect, useCallback } from 'react';

export function useCooldown(key: string, durationMinutes: number) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const checkCooldown = () => {
      try {
        const stored = localStorage.getItem(`cooldown_${key}`);
        if (stored) {
          const expiresAt = parseInt(stored, 10);
          const now = Date.now();
          if (now < expiresAt) {
            setRemaining(Math.ceil((expiresAt - now) / 1000));
          } else {
            setRemaining(0);
            localStorage.removeItem(`cooldown_${key}`);
          }
        } else {
          setRemaining(0);
        }
      } catch {}
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [key]);

  const triggerCooldown = useCallback(() => {
    try {
      const expiresAt = Date.now() + durationMinutes * 60 * 1000;
      localStorage.setItem(`cooldown_${key}`, expiresAt.toString());
      setRemaining(durationMinutes * 60);
    } catch {}
  }, [key, durationMinutes]);

  const clearCooldown = useCallback(() => {
    try {
      localStorage.removeItem(`cooldown_${key}`);
      setRemaining(0);
    } catch {}
  }, [key]);

  return { remaining, triggerCooldown, clearCooldown, isBlocked: remaining > 0 };
}
