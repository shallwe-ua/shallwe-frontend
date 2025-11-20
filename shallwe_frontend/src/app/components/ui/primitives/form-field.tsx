import * as React from 'react'
import { cn } from '@/lib/utils'

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  description?: string
  hint?: string
  error?: string
  required?: boolean
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, description, hint, error, required, className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('form-field', className)} {...props}>
        {(label || description) && (
          <div className="space-y-1">
            {label && (
              <label className="field-label">
                {label}
                {required && <span className="field-required">*</span>}
              </label>
            )}
            {description && <p className="field-description">{description}</p>}
          </div>
        )}

        <div className="stack stack-xs">{children}</div>

        {error ? (
          <p className="field-hint field-error">{error}</p>
        ) : (
          hint && <p className="field-hint">{hint}</p>
        )}
      </div>
    )
  }
)
FormField.displayName = 'FormField'
