import * as React from 'react'
import { FormField, FormFieldProps } from './primitives/form-field'
import { Textarea, TextareaProps } from './primitives/textarea'
import { cn } from '@/lib/utils'

export type TextareaFieldProps = FormFieldProps &
  Omit<TextareaProps, 'className'> & {
    textareaClassName?: string
    showCount?: boolean
  }

export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  (
    {
      label,
      description,
      hint,
      error,
      required,
      textareaClassName,
      className,
      showCount,
      value,
      maxLength,
      ...textareaProps
    },
    ref
  ) => {
    const count =
      typeof value === 'string'
        ? value.length
        : typeof textareaProps.defaultValue === 'string'
          ? textareaProps.defaultValue.length
          : 0

    const counter =
      showCount && maxLength ? (
        <div className="text-right text-xs text-muted-foreground">
          {count}/{maxLength}
        </div>
      ) : null

    return (
      <FormField
        label={label}
        description={description}
        hint={error ? undefined : hint}
        error={error}
        required={required}
        className={className}
      >
        <Textarea
          ref={ref}
          className={cn(textareaClassName)}
          value={value}
          maxLength={maxLength}
          {...textareaProps}
        />
        {counter}
      </FormField>
    )
  }
)
TextareaField.displayName = 'TextareaField'
