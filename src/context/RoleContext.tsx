import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppUserRole, APP_ROLE_CONFIGS, RoleConfig } from '../types/rbac';

interface RoleContextValue {
  userRole: AppUserRole;
  setUserRole: (role: AppUserRole) => void;
  roleConfig: RoleConfig;
  isAdmin: boolean;
  isVet: boolean;
  isKeeper: boolean;
  isWarehouse: boolean;
  isChief: boolean;
  isReadOnly: boolean;
  canManageTasks: boolean;
  canEditHandbook: boolean;
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
      if (saved && (saved === 'admin' || saved === 'vet' || saved === 'keeper' || saved === 'warehouse' || saved === 'chief')) {
        return saved as AppUserRole;
      }
    } catch {}
    return 'keeper';
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
        if (e.newValue === 'admin' || e.newValue === 'vet' || e.newValue === 'keeper' || e.newValue === 'warehouse' || e.newValue === 'chief') {
          setUserRoleState(e.newValue as AppUserRole);
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const isAdmin = userRole === 'admin';
  const isVet = userRole === 'vet';
  const isKeeper = userRole === 'keeper';
  const isWarehouse = userRole === 'warehouse';
  const isChief = userRole === 'chief';

  const isReadOnly = isChief;
  const canManageTasks = isAdmin || isVet;
  const canEditHandbook = isAdmin || isVet;
  const canAccessShift = true;
  const canAccessCalendar = true;
  const canInteractElephantHouse = isKeeper || isAdmin;
  const canEditShift = isKeeper || isAdmin;
  const canViewVetTasks = true;

  const roleConfig = APP_ROLE_CONFIGS[userRole] || APP_ROLE_CONFIGS.keeper;

  return (
    <RoleContext.Provider
      value={{
        userRole,
        setUserRole,
        roleConfig,
        isAdmin,
        isVet,
        isKeeper,
        isWarehouse,
        isChief,
        isReadOnly,
        canManageTasks,
        canEditHandbook,
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
    const role: AppUserRole = 'keeper';
    return {
      userRole: role,
      setUserRole: () => {},
      roleConfig: APP_ROLE_CONFIGS.keeper,
      isAdmin: false,
      isVet: false,
      isKeeper: true,
      isWarehouse: false,
      isChief: false,
      isReadOnly: false,
      canManageTasks: false,
      canEditHandbook: false,
      canAccessShift: true,
      canAccessCalendar: true,
      canEditShift: true,
      canInteractElephantHouse: true,
      canViewVetTasks: true,
    };
  }
  return ctx;
}
