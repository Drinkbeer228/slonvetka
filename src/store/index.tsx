import React, { createContext, useContext, useState, useEffect } from 'react';
import { repository, AppState } from './repository';
import { Elephant, Keeper, Assignment, TreatmentRecord } from '../types';

interface StoreContextType extends AppState {
  setActiveKeeper: (id: string | null) => void;
  addRecord: (record: TreatmentRecord) => void;
  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (assignment: Assignment) => void;
  deleteAssignment: (id: string) => void;
  deleteRecord: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(repository.getState());

  // Force update when repository changes
  const updateState = () => {
    setState({ ...repository.getState() });
  };

  const setActiveKeeper = (id: string | null) => {
    repository.setActiveKeeper(id);
    updateState();
  };

  const addRecord = (record: TreatmentRecord) => {
    repository.addRecord(record);
    updateState();
  };

  const addAssignment = (assignment: Assignment) => {
    repository.addAssignment(assignment);
    updateState();
  };

  const updateAssignment = (assignment: Assignment) => {
    repository.updateAssignment(assignment);
    updateState();
  };
  
  const deleteAssignment = (id: string) => {
    repository.deleteAssignment(id);
    updateState();
  };
  
  const deleteRecord = (id: string) => {
    repository.deleteRecord(id);
    updateState();
  };

  return (
    <StoreContext.Provider value={{
      ...state,
      setActiveKeeper,
      addRecord,
      addAssignment,
      updateAssignment,
      deleteAssignment,
      deleteRecord
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
