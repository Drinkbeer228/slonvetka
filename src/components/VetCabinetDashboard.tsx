import React from 'react';
import { VetDashboard } from '../screens/VetDashboard';

interface VetCabinetDashboardProps {
  onNavigate?: (screen: string) => void;
}

export function VetCabinetDashboard({ onNavigate }: VetCabinetDashboardProps) {
  return <VetDashboard onNavigate={onNavigate} />;
}

export function VetKeeperViewToggle() {
  return null;
}
