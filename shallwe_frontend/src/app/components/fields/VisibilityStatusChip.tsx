import * as React from 'react'
import { StatusChip } from '@/app/components/ui'

export interface VisibilityStatusChipProps {
  visible: boolean
}

export const VisibilityStatusChip: React.FC<VisibilityStatusChipProps> = ({ visible }) => (
  <StatusChip tone={visible ? 'success' : 'warning'}>
    {visible ? 'Profile visible' : 'Profile hidden'}
  </StatusChip>
)
