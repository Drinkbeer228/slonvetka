import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUserRole, APP_ROLE_CONFIGS, RoleConfig } from '../types/rbac';

interface RoleContextValue {
  userRole: AppUserRole;
  setUserRole: (role: AppUserRole) => void;
  roleConfig: RoleConfig;
  isAdmin: boolean;
  isKeeper: boolean;
  isWarehouse: boolean;
  isChief: boolean;
  isReadOnly: boolean;
  canAccessShift: boolean;
  canAccessCalendar: boolean;
  canEditShift: boolean;
  canInteractElephantHouse: boolean;
  canViewVetTasks: boolean;
}

const RoleContext = createContext<RoleContextValue | null>(null);

const STORAGE_KEY = 'slonovet_user_role';

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userRole, setUserRoleState] = useState<AppUserRole>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'admin' || saved === 'keeper' || saved === 'warehouse' || saved === 'chief')) {
        return saved as AppUserRole;
      }
    } catch {}
    return 'admin';
  });

  const setUserRole = (newRole: AppUserRole) => {
    setUserRoleState(newRole);
    try {
      localStorage.setItem(STORAGE_KEY, newRole);
      window.dispatchEvent(new CustomEvent('slonovet-role-change', { detail: newRole }));
    } catch {}
  };

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        if (e.newValue === 'admin' || e.newValue === 'keeper' || e.newValue === 'warehouse' || e.newValue === 'chief') {
          setUserRoleState(e.newValue as AppUserRole);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isAdmin = userRole === 'admin';
  const isKeeper = userRole === 'keeper';
  const isWarehouse = userRole === 'warehouse';
  const isChief = userRole === 'chief';

  const isReadOnly = isChief;
  const canAccessShift = userRole !== 'warehouse';
  const canAccessCalendar = userRole !== 'warehouse';
  // В слоновнике взаимодействовать могут только пользователи с ролью "кипер"
  const canInteractElephantHouse = isKeeper;
  const canEditShift = isKeeper;
  const canViewVetTasks = userRole !== 'keeper' && userRole !== 'warehouse';

  const roleConfig = APP_ROLE_CONFIGS[userRole] || APP_ROLE_CONFIGS.admin;

  return (
    <RoleContext.Provider
      value={{
        userRole,
        setUserRole,
        roleConfig,
        isAdmin,
        isKeeper,
        isWarehouse,
        isChief,
        isReadOnly,
        canAccessShift,
        canAccessCalendar,
        canEditShift,
        canInteractElephantHouse,
        canViewVetTasks,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    // Graceful fallback if called outside provider
    const role: AppUserRole = 'admin';
    return {
      userRole: role,
      setUserRole: () => {},
      roleConfig: APP_ROLE_CONFIGS.admin,
      isAdmin: true,
      isKeeper: false,
      isWarehouse: false,
      isChief: false,
      isReadOnly: false,
      canAccessShift: true,
      canAccessCalendar: true,
      canEditShift: false,
      canInteractElephantHouse: false,
      canViewVetTasks: true,
    };
  }
  return ctx;
}
