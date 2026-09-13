import React from 'react';
import { ElephantDailyMetrics, ShiftPhoto } from '../../types/shift';
import { SleepSection } from './SleepSection';

interface Props {
  metrics: ElephantDailyMetrics;
  isLocked: boolean;
  onMetricChange: (field: string, value: any) => void;
  photos: ShiftPhoto[];
  onAddPhoto: (p: ShiftPhoto) => void;
  onRemovePhoto: (id: string) => void;
}

export function NightSleepSection(props: Props) {
  return <SleepSection {...props} />;
}

