import * as React from 'react'
import { cn } from '@/lib/utils'

type SectionTag = keyof HTMLElementTagNameMap

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  as?: SectionTag
  bleed?: boolean
  fullWidth?: boolean
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(
  ({ as = 'section', bleed = false, fullWidth = false, className, ...props }, ref) => {
    return React.createElement(as, {
      ref,
      className: cn(
        'section-shell',
        fullWidth && 'section-shell--fluid',
        bleed && 'px-0',
        className
      ),
      ...props,
    })
  }
)
Section.displayName = 'Section'
