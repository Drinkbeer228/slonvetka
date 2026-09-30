import React from 'react';
import { ExecutionBottomSheet, ExecutionBottomSheetProps } from './daily-shift/ExecutionBottomSheet';

export interface ExecutionModalProps extends ExecutionBottomSheetProps {}

/**
 * ExecutionModal provides backward-compatible access to the mobile ExecutionBottomSheet.
 */
export function ExecutionModal(props: ExecutionModalProps) {
  return <ExecutionBottomSheet {...props} />;
}
