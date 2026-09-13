import React from 'react';
import { BreakfastSection, BreakfastSectionProps } from './BreakfastSection';

export { BreakfastSection };
export type { BreakfastSectionProps };

export function MorningPorridgeSection(props: BreakfastSectionProps) {
  return <BreakfastSection {...props} />;
}
