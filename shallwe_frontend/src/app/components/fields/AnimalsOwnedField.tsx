import * as React from 'react'
import { CheckboxGroupField } from '@/app/components/ui'

type AnimalKey = 'has_cats' | 'has_dogs' | 'has_reptiles' | 'has_birds'

export interface AnimalsOwnedValue {
  has_cats: boolean | null
  has_dogs: boolean | null
  has_reptiles: boolean | null
  has_birds: boolean | null
}

export interface AnimalsOwnedFieldProps {
  value: AnimalsOwnedValue
  onChange: (field: AnimalKey, checked: boolean) => void
}

const options = [
  { label: 'Cats', value: 'has_cats' },
  { label: 'Dogs', value: 'has_dogs' },
  { label: 'Reptiles', value: 'has_reptiles' },
  { label: 'Birds', value: 'has_birds' },
]

export const AnimalsOwnedField: React.FC<AnimalsOwnedFieldProps> = ({ value, onChange }) => {
  const values = options.filter((opt) => value[opt.value as AnimalKey]).map((opt) => opt.value)

  return (
    <CheckboxGroupField
      label="I have animals"
      hint="Pick every animal you live with."
      values={values}
      onChange={(next) => {
        options.forEach((opt) => {
          const checked = next.includes(opt.value)
          if (checked !== Boolean(value[opt.value as AnimalKey])) {
            onChange(opt.value as AnimalKey, checked)
          }
        })
      }}
      options={options}
      direction="horizontal"
    />
  )
}
