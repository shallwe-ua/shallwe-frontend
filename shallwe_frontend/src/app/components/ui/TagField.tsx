import * as React from 'react'
import { TagsInput, TagsInputProps } from 'react-tag-input-component'
import { FormField, FormFieldProps } from './primitives/form-field'

type BaseProps = Omit<TagsInputProps, 'value' | 'onChange' | 'name'>

export interface TagFieldProps extends FormFieldProps, BaseProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  inputId?: string
}

const wrapperClass =
  'rounded-[var(--radius-sm)] border border-border bg-card px-3.5 py-3 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background'

const tagClassNames = {
  tag: 'rounded-[var(--radius-xs)] bg-brand-weak px-2 py-1 text-sm text-primary',
  input:
    'mt-0 block w-full border-0 bg-transparent p-0 text-sm text-foreground placeholder:text-muted focus:outline-none',
}

export const TagField: React.FC<TagFieldProps> = ({
  label,
  description,
  hint,
  error,
  required,
  className,
  value,
  onChange,
  placeholder,
  inputId,
  ...rest
}) => (
  <FormField
    label={label}
    description={description}
    hint={hint}
    error={error}
    required={required}
    className={className}
  >
    <div className={wrapperClass}>
      <TagsInput
        value={value}
        onChange={onChange}
        name={inputId}
        placeholder={placeholder}
        classNames={tagClassNames}
        {...rest}
      />
    </div>
  </FormField>
)
