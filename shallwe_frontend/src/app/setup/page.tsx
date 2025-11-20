'use client'


import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { TagsInput } from 'react-tag-input-component'

import ProfilePhotoPick from '../components/profile/ProfilePhotoPick'
import Locations from '../components/profile/Locations'

import { env } from '@/config/env'
import { getDocumentCookie } from '@/lib/common/cookie'
import { ProfileCreateFormState, profileCreateFormStateInitial } from '@/lib/shallwe/profile/formstates/states' 
import { collectProfileCreateDataFromState } from '@/lib/shallwe/profile/formstates/collectors/create'
import { validateProfileCreateFields } from '@/lib/shallwe/profile/formstates/validators/create'
import { ValidationResult, validators } from '@/lib/shallwe/profile/formstates/validators/common'
import { ProfileCreateData } from '@/lib/shallwe/profile/api/schema/create'
import { createProfile } from '@/lib/shallwe/profile/api/calls'
import { ApiError } from '@/lib/shallwe/common/api/calls'
import BirthDateSelect from '../components/profile/BirthDateSelect'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Section } from '@/components/ui/section'
import { Stack } from '@/components/ui/stack'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Radio } from '@/components/ui/radio'
import { Select } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'


// Dividing visual flow in steps for better UX
const STEPS = [
  { id: 'profile', name: 'Basic Info' },
  { id: 'about', name: 'About You' },
  { id: 'preferences', name: 'Rent Preferences' },
]

const tagInputWrapperClass = 'rounded-[var(--radius-sm)] border border-border bg-card px-3.5 py-3'

const tagInputClassNames = {
  tag: 'rounded-[var(--radius-xs)] bg-brand-weak px-2 py-1 text-sm text-primary',
  input:
    'mt-0 block w-full border-0 bg-transparent p-0 text-sm text-foreground placeholder:text-muted focus:outline-none',
}

type SmokingField = 'smokes_iqos' | 'smokes_vape' | 'smokes_tobacco' | 'smokes_cigs'
type AnimalField = 'has_cats' | 'has_dogs' | 'has_reptiles' | 'has_birds'

const smokingTypeOptions: { id: string; label: string; field: SmokingField }[] = [
  { id: 'smokes_iqos', label: 'IQOS', field: 'smokes_iqos' },
  { id: 'smokes_vape', label: 'Vape', field: 'smokes_vape' },
  { id: 'smokes_tobacco', label: 'Tobacco', field: 'smokes_tobacco' },
  { id: 'smokes_cigs', label: 'Cigarettes', field: 'smokes_cigs' },
]

const animalOptions: { id: string; label: string; field: AnimalField }[] = [
  { id: 'has_cats', label: 'Cats', field: 'has_cats' },
  { id: 'has_dogs', label: 'Dogs', field: 'has_dogs' },
  { id: 'has_reptiles', label: 'Reptiles', field: 'has_reptiles' },
  { id: 'has_birds', label: 'Birds', field: 'has_birds' },
]


// Fields that are validated beyond basic type match
const STEP_0_FIELDS_TO_VALIDATE = [
  'profile.name',
  'profile.photo',
]
const STEP_1_FIELDS_TO_VALIDATE = [
  'about.birth_date',
  'about.gender',
  'about.is_couple',
  'about.has_children',
  'about.smoking_level',
  'about.other_animals',
  'about.interests',
  'about.bio',
]
const STEP_2_FIELDS_VALIDATE = [
  'rent_preferences.min_budget',
  'rent_preferences.max_budget',
  'rent_preferences.min_rent_duration_level',
  'rent_preferences.max_rent_duration_level',
  'rent_preferences.locations',
]


export default function ProfileSetupPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formState, setFormState] = useState<ProfileCreateFormState>(profileCreateFormStateInitial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [isAboutAccordionOpen, setIsAboutAccordionOpen] = useState(false)
  const [locationsApiError, setLocationsApiError] = useState<string | null>(null)


  // Skip to Step N (DEV test feature)
  useEffect(() => {
    if (env.NEXT_PUBLIC_SHALLWE_ENV_MODE === 'DEV') {
      const skipCookieName = 'shallwe_test_profile_create_skip_to_step'

      const skipToStepValue = getDocumentCookie(skipCookieName)
      console.log(`ProfileSetupPage: Found cookie '${skipCookieName}': ${skipToStepValue}`)

      if (skipToStepValue) {
        const targetStep = parseInt(skipToStepValue, 10)
        if (!isNaN(targetStep) && targetStep >= 0 && targetStep <= 2) {
          console.log(`ProfileSetupPage: QA Cookie requests skipping to step ${targetStep}.`)
          setCurrentStep(targetStep)
        }
        else {
          console.warn(`ProfileSetupPage: Invalid step number '${skipToStepValue}' found in cookie '${skipCookieName}'. Ignoring.`) // Optional: Log warning
        }
      }
    }
  }, [])


  // Define a helper function to run validation and update errors
  const validateCurrentTagsInput = (fieldName: string, tagsToValidate: string[], validatorKey: string) => {
    const validationError = validators[validatorKey](tagsToValidate, formState)
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors }
      if (validationError !== null) {
        newErrors[fieldName] = validationError
      } else {
        delete newErrors[fieldName] // Clear error if validation passes
      }
      return newErrors
    })
    return validationError
  }

  const updateSmokingLevelAndClearTypes = (newLevel: ProfileCreateFormState['about']['smoking_level']) => {
    setGeneralError(null);
    setFormState(prev => {
      const updatedAbout = { ...prev.about, smoking_level: newLevel };

      // Check if the new level is null or 1
      if (newLevel === null || newLevel === 1) {
        // Reset smoking type booleans to false
        updatedAbout.smokes_iqos = false;
        updatedAbout.smokes_vape = false;
        updatedAbout.smokes_tobacco = false;
        updatedAbout.smokes_cigs = false;
      }

      return {
        ...prev,
        about: updatedAbout,
      };
    });

    // Clear specific field error when user starts typing/modifying
    if (errors['about.smoking_level']) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors['about.smoking_level'];
        return newErrors;
      });
    }
  };
  

  // Update the photo handler to interact with the PhotoCropper component
  const handlePhotoCropped = (croppedFile: File) => {
    updateFormState('profile', 'photo', croppedFile)
  }

  const ensureSmokingLevelBeforeTypes = (errorsMap: Record<string, string>) => {
    const hasTypeSelected = smokingTypeOptions.some(option => formState.about[option.field])
    const missingLevel = formState.about.smoking_level === null || formState.about.smoking_level === undefined

    if (hasTypeSelected && missingLevel) {
      errorsMap['about.smoking_level'] = 'Select a smoking level before choosing smoking types.'
      return false
    }

    return true
  }

  // Callback for PhotoCropper to set error in the main page's state
  const handlePhotoError = (error: string) => {
    setErrors(prevErrors => ({
        ...prevErrors,
        'profile.photo': error // Set the specific field error
    }))
  }

  // Callback for PhotoCropper to clear error in the main page's state
  const clearPhotoError = () => {
    setErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        delete newErrors['profile.photo'] // Remove the specific field error
        return newErrors
    })
  }


  const clearLocationsApiError = () => {
     if (locationsApiError) {
         setLocationsApiError(null)
     }
  }


  const updateFormState = <S extends keyof ProfileCreateFormState, F extends keyof ProfileCreateFormState[S]>(
    section: S, field: F, value: ProfileCreateFormState[S][F]
  ) => {
    setGeneralError(null)
    setFormState(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
    // Clear specific field error when user starts typing/modifying
    if (errors[`${section}.${String(field)}`]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[`${section}.${String(field)}`]
        return newErrors
      })
    }
  }


  const validateCurrentStep = (): boolean => {
    let fieldsToValidate: string[] = []
    switch (currentStep) {
      case 0:
        fieldsToValidate = STEP_0_FIELDS_TO_VALIDATE
        break
      case 1:
        fieldsToValidate = STEP_1_FIELDS_TO_VALIDATE
        break
      case 2:
        fieldsToValidate = STEP_2_FIELDS_VALIDATE
        break
      default:
        fieldsToValidate = []
    }

    const validation: ValidationResult = validateProfileCreateFields(formState, fieldsToValidate)
    const nextErrors = { ...validation.errors }
    const smokingOk = ensureSmokingLevelBeforeTypes(nextErrors)
    setErrors(nextErrors)
    return validation.isValid && smokingOk
  }


  const validateAllFields = (): ValidationResult => {
    // Validate all fields for final submission
    const allFields = [...STEP_0_FIELDS_TO_VALIDATE, ...STEP_1_FIELDS_TO_VALIDATE, ...STEP_2_FIELDS_VALIDATE]
    const validation: ValidationResult = validateProfileCreateFields(formState, allFields)
    const nextErrors = { ...validation.errors }
    const smokingOk = ensureSmokingLevelBeforeTypes(nextErrors)
    setErrors(nextErrors)
    return { isValid: validation.isValid && smokingOk, errors: nextErrors }
  }


  const nextStep = () => {
    setGeneralError(null)
    if (validateCurrentStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1)
      }
    }
  }


  const prevStep = () => {
    setGeneralError(null)
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }


  const handleSubmit = async () => {
    setGeneralError(null)
    setIsLoading(true)

    const validationResult = validateAllFields()
    if (!validationResult.isValid) {
      console.log("Final validation failed, cannot submit.");
      // Set a user-facing error message
      const prevStepErrors = Object.keys(validationResult.errors).filter(
        fieldName => !STEP_2_FIELDS_VALIDATE.includes(fieldName)
      );

      if (prevStepErrors.length > 0) {
        const prevStepsInvalidFields = prevStepErrors.join(", ");
        setGeneralError(`Some previous fields weren't correct, please check again: ${prevStepsInvalidFields}.`);
      }

      setIsLoading(false); // Stop loading state as submission is halted
      return; // Do not proceed if final validation fails
    }

    setApiError(null)
    setErrors({}) // Clear previous API errors (and client-side validation errors)

    try {
      const profileDataToSend: ProfileCreateData = collectProfileCreateDataFromState(formState);
      console.log("Collected Profile Data for API:", profileDataToSend); // Debug log
      await createProfile(profileDataToSend);
      console.log("Profile created successfully!");
      router.push('/settings');
    } catch (error) {
      console.error("Error creating profile:", error);
      // Handle API errors here, potentially setting 'generalError' or 'apiError'
      let errorMessage = "An unexpected error occurred.";
      if (error && typeof error === 'object' && 'details' in error) {
        const err = error as ApiError;
        console.log("API Error Details:", err.details);
        if (err.details && typeof err.details === 'object' && 'error' in err.details) {
          const apiErrors = err.details.error;
          if (typeof apiErrors === 'object') {
            // You might want to format this object into a more user-friendly string
            errorMessage = JSON.stringify(apiErrors);
          } else if (typeof apiErrors === 'string') {
            errorMessage = apiErrors;
          } else {
             errorMessage = "Received an unexpected error format from the server.";
          }
        } else {
          errorMessage = err.message || errorMessage;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      setGeneralError(errorMessage); // Use the general error state for API errors too, or keep separate 'apiError'
    } finally {
      setIsLoading(false); // Always stop loading state in 'finally'
    }
  };


  // --- STEP RENDER OPTIONS ---
  const getStepContent = () => {
    switch (currentStep) {
      
      // Step 1 Basic info
      case 0:
        return (
          <Stack gap="sm">
            <Stack gap="xs">
              <h2 className="text-base font-semibold text-foreground">Profile basics</h2>
            </Stack>
            <FormField label="Display name (Cyrillic)" error={errors['profile.name']} required>
              <Input
                id="name"
                autoComplete="name"
                value={formState.profile.name ?? ''}
                onChange={(e) => updateFormState('profile', 'name', e.target.value || null)}
              />
            </FormField>

            <FormField
              label="Profile Photo"
              description="Clear, square photos crop best."
              error={errors['profile.photo']}
            >
              <ProfilePhotoPick
                initialFile={formState.profile.photo}
                onError={handlePhotoError}
                onClearError={clearPhotoError}
                onCropComplete={handlePhotoCropped}
              />
            </FormField>
          </Stack>
        )
      
      // Step 2 About
      case 1:
        return (
          <Stack gap="sm">
            <Stack gap="xs">
              <h2 className="text-base font-semibold text-foreground">About you</h2>
              <p className="text-sm text-muted-foreground">Tell us the basics about your household and habits.</p>
            </Stack>

            <FormField label="Birth date" error={errors['about.birth_date']} required>
              <BirthDateSelect
                inputId="birth_date"
                currentValue={formState.about.birth_date}
                onChange={(dateString) => updateFormState('about', 'birth_date', dateString)}
              />
            </FormField>

            <FormField label="Gender" error={errors['about.gender']} required>
              <div className="space-y-2">
                {[
                  { id: 'gender_male', value: 1, label: 'Male' },
                  { id: 'gender_female', value: 2, label: 'Female' },
                ].map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={option.id}
                    className="flex items-center gap-2 text-sm text-muted"
                  >
                    <Radio
                      id={option.id}
                      name="gender"
                      checked={formState.about.gender === option.value}
                      onChange={() => updateFormState('about', 'gender', option.value as 1 | 2)}
                    />
                    {option.label}
                  </Label>
                ))}
              </div>
            </FormField>

            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Apply as a couple" error={errors['about.is_couple']}>
                <Label htmlFor="is_couple" className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    id="is_couple"
                    checked={formState.about.is_couple === true}
                    onChange={(e) => updateFormState('about', 'is_couple', e.target.checked)}
                  />
                  We’re applying as a couple
                </Label>
              </FormField>

              <FormField label="Children at home" error={errors['about.has_children']}>
                <Label htmlFor="has_children" className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    id="has_children"
                    checked={formState.about.has_children === true}
                    onChange={(e) => updateFormState('about', 'has_children', e.target.checked)}
                  />
                  Kids live with me
                </Label>
              </FormField>
            </div>

            {/* Optional Fields Accordion */}
            <div className="mt-2 rounded border border-border">
              <button
                type="button"
                onClick={() => setIsAboutAccordionOpen(!isAboutAccordionOpen)}
                aria-expanded={isAboutAccordionOpen}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-foreground"
              >
                <span>Lifestyle extras</span>
                <svg
                  className={cn('h-4 w-4 text-muted-foreground transition-transform', isAboutAccordionOpen && 'rotate-180')}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {isAboutAccordionOpen && (
                <div className="px-3 py-3 space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField label="Occupation Type" error={errors['about.occupation_type']}>
                      <Select
                        id="occupation_type"
                        value={formState.about.occupation_type ?? ''}
                        onChange={(e) =>
                          updateFormState(
                            'about',
                            'occupation_type',
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3 | 4) : null
                          )
                        }
                      >
                        <option value="">Select...</option>
                        <option value="1">Employed</option>
                        <option value="2">Student</option>
                        <option value="3">Unemployed</option>
                        <option value="4">Retired</option>
                      </Select>
                    </FormField>

                    <FormField label="Drinking Level" error={errors['about.drinking_level']}>
                      <Select
                        id="drinking_level"
                        value={formState.about.drinking_level ?? ''}
                        onChange={(e) =>
                          updateFormState(
                            'about',
                            'drinking_level',
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3 | 4) : null
                          )
                        }
                      >
                        <option value="">Select...</option>
                        <option value="1">Never</option>
                        <option value="2">Rarely</option>
                        <option value="3">Socially</option>
                        <option value="4">Often</option>
                      </Select>
                    </FormField>

                    <FormField label="Neighbourliness Level" error={errors['about.neighbourliness_level']}>
                      <Select
                        id="neighbourliness_level"
                        value={formState.about.neighbourliness_level ?? ''}
                        onChange={(e) =>
                          updateFormState(
                            'about',
                            'neighbourliness_level',
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : null
                          )
                        }
                      >
                        <option value="">Select...</option>
                        <option value="1">Low</option>
                        <option value="2">Medium</option>
                        <option value="3">High</option>
                      </Select>
                    </FormField>

                    <FormField label="Guests Level" error={errors['about.guests_level']}>
                      <Select
                        id="guests_level"
                        value={formState.about.guests_level ?? ''}
                        onChange={(e) =>
                          updateFormState(
                            'about',
                            'guests_level',
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : null
                          )
                        }
                      >
                        <option value="">Select...</option>
                        <option value="1">Low</option>
                        <option value="2">Medium</option>
                        <option value="3">High</option>
                      </Select>
                    </FormField>

                    <FormField label="Parties Level" error={errors['about.parties_level']}>
                      <Select
                        id="parties_level"
                        value={formState.about.parties_level ?? ''}
                        onChange={(e) =>
                          updateFormState(
                            'about',
                            'parties_level',
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : null
                          )
                        }
                      >
                        <option value="">Select...</option>
                        <option value="1">Low</option>
                        <option value="2">Medium</option>
                        <option value="3">High</option>
                      </Select>
                    </FormField>

                    <FormField label="Bedtime" error={errors['about.bedtime_level']}>
                      <Select
                        id="bedtime_level"
                        value={formState.about.bedtime_level ?? ''}
                        onChange={(e) =>
                          updateFormState(
                            'about',
                            'bedtime_level',
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3 | 4) : null
                          )
                        }
                      >
                        <option value="">Select...</option>
                        <option value="1">Early (around 22:00)</option>
                        <option value="2">Midnight</option>
                        <option value="3">Late (around 02:00)</option>
                        <option value="4">Very Late (around 04:00)</option>
                      </Select>
                    </FormField>

                    <FormField label="Neatness Level" error={errors['about.neatness_level']}>
                      <Select
                        id="neatness_level"
                        value={formState.about.neatness_level ?? ''}
                        onChange={(e) =>
                          updateFormState(
                            'about',
                            'neatness_level',
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : null
                          )
                        }
                      >
                        <option value="">Select...</option>
                        <option value="1">Low</option>
                        <option value="2">Medium</option>
                        <option value="3">High</option>
                      </Select>
                    </FormField>

                    <FormField label="Smoking Level" error={errors['about.smoking_level']}>
                      <Select
                        id="smoking_level"
                        value={formState.about.smoking_level ?? ''}
                        onChange={(e) =>
                          updateSmokingLevelAndClearTypes(
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3 | 4) : null
                          )
                        }
                      >
                        <option value="">Select...</option>
                        <option value="1">Never</option>
                        <option value="2">Rarely</option>
                        <option value="3">Socially</option>
                        <option value="4">Often</option>
                      </Select>
                    </FormField>

                    <FormField label="Smoking Types" hint="Select all that apply" className="col-span-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
                        {[
                          { id: 'smokes_iqos', label: 'IQOS', field: 'smokes_iqos' as const },
                          { id: 'smokes_vape', label: 'Vape', field: 'smokes_vape' as const },
                          { id: 'smokes_tobacco', label: 'Tobacco', field: 'smokes_tobacco' as const },
                          { id: 'smokes_cigs', label: 'Cigarettes', field: 'smokes_cigs' as const },
                        ].map((option) => (
                          <Label
                            key={option.id}
                            htmlFor={option.id}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <Checkbox
                              id={option.id}
                              checked={formState.about[option.field] === true}
                              onChange={(e) => updateFormState('about', option.field, e.target.checked)}
                            />
                            {option.label}
                          </Label>
                        ))}
                      </div>
                    </FormField>

                    <FormField label="I have animals" hint="Pick every animal you live with.">
                      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                        {animalOptions.map((animal) => (
                          <Label
                            key={animal.id}
                            htmlFor={animal.id}
                            className="flex items-center gap-2 text-sm text-muted-foreground"
                          >
                            <Checkbox
                              id={animal.id}
                              checked={formState.about[animal.field] === true}
                              onChange={(e) => updateFormState('about', animal.field, e.target.checked)}
                            />
                            {animal.label}
                          </Label>
                        ))}
                      </div>
                    </FormField>

                    <FormField
                      label="Other animals (up to 5)"
                      error={errors['about.other_animals']}
                      hint="Press Enter to add each animal."
                      className="md:col-span-2"
                    >
                      <div className={tagInputWrapperClass}>
                        <TagsInput
                          isEditOnRemove
                          value={formState.about.other_animals || []}
                          beforeAddValidate={(newTag: string, currentTags: string[]) => {
                            const newTagsCandidate = [...currentTags, newTag]
                            const validationError = validators['about.other_animals'](newTagsCandidate, formState)
                            if (validationError !== null) {
                              setErrors((prevErrors) => ({
                                ...prevErrors,
                                'about.other_animals': validationError,
                              }))
                              return false
                            }
                            setErrors((prevErrors) => {
                              const newErrors = { ...prevErrors }
                              delete newErrors['about.other_animals']
                              return newErrors
                            })
                            return true
                          }}
                          onChange={(tags: string[]) => {
                            setErrors((prevErrors) => {
                              const newErrors = { ...prevErrors }
                              delete newErrors['about.other_animals']
                              return newErrors
                            })
                            updateFormState('about', 'other_animals', tags)
                          }}
                          onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            const inputValue = (e.target as HTMLInputElement).value
                            const currentTags = formState.about.other_animals || []
                            if (inputValue) {
                              const newTagsCandidate = [...currentTags, inputValue]
                              validateCurrentTagsInput('about.other_animals', newTagsCandidate, 'about.other_animals')
                            } else {
                              validateCurrentTagsInput('about.other_animals', currentTags, 'about.other_animals')
                            }
                          }}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            const inputElement = e.target as HTMLInputElement
                            const inputValue = inputElement.value
                            if (inputValue) {
                              inputElement.value = ''
                              setErrors((prevErrors) => {
                                const newErrors = { ...prevErrors }
                                delete newErrors['about.other_animals']
                                return newErrors
                              })
                            }
                          }}
                          name="other_animals"
                          placeholder="Press Enter to add"
                          classNames={tagInputClassNames}
                        />
                      </div>
                    </FormField>

                    <FormField
                      label="Interests (up to 5)"
                      error={errors['about.interests']}
                      hint="Press Enter to add each hobby."
                      className="md:col-span-2"
                    >
                      <div className={tagInputWrapperClass}>
                        <TagsInput
                          isEditOnRemove
                          value={formState.about.interests || []}
                          beforeAddValidate={(newTag: string, currentTags: string[]) => {
                            const newTagsCandidate = [...currentTags, newTag]
                            const validationError = validators['about.interests'](newTagsCandidate, formState)
                            if (validationError !== null) {
                              setErrors((prevErrors) => ({
                                ...prevErrors,
                                'about.interests': validationError,
                              }))
                              return false
                            }

                            setErrors((prevErrors) => {
                              const newErrors = { ...prevErrors }
                              delete newErrors['about.interests']
                              return newErrors
                            })
                            return true
                          }}
                          onChange={(tags) => {
                            setErrors((prevErrors) => {
                              const newErrors = { ...prevErrors }
                              delete newErrors['about.interests']
                              return newErrors
                            })
                            updateFormState('about', 'interests', tags)
                          }}
                          onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            const inputValue = (e.target as HTMLInputElement).value
                            const currentTags = formState.about.interests || []
                            if (inputValue) {
                              const newTagsCandidate = [...currentTags, inputValue]
                              validateCurrentTagsInput('about.interests', newTagsCandidate, 'about.interests')
                            } else {
                              validateCurrentTagsInput('about.interests', currentTags, 'about.interests')
                            }
                          }}
                          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                            const inputElement = e.target as HTMLInputElement
                            const inputValue = inputElement.value
                            if (inputValue) {
                              inputElement.value = ''
                              setErrors((prevErrors) => {
                                const newErrors = { ...prevErrors }
                                delete newErrors['about.interests']
                                return newErrors
                              })
                            }
                          }}
                          name="interests"
                          placeholder="Press Enter to add"
                          classNames={tagInputClassNames}
                        />
                      </div>
                    </FormField>

                    <FormField label="Bio (up to 1024 chars)" error={errors['about.bio']} className="md:col-span-2">
                      <Textarea
                        id="bio"
                        rows={3}
                        value={formState.about.bio ?? ''}
                        onChange={(e) => updateFormState('about', 'bio', e.target.value || null)}
                        className={cn(
                          'min-h-[120px]',
                          (errors['about.bio'] || (formState.about.bio && formState.about.bio.length > 1024)) &&
                            'ring-2 ring-destructive'
                        )}
                      />
                      <p
                        className={cn(
                          'text-xs',
                          formState.about.bio && formState.about.bio.length > 1024 ? 'text-destructive' : 'text-muted-foreground'
                        )}
                      >
                        {formState.about.bio ? formState.about.bio.length : 0} / 1024 characters
                      </p>
                    </FormField>
                  </div>
                </div>
              )}
            </div>

            {/* End of Optional Fields Accordion */}

          </Stack>
        )
      
      // Step 3 Rent
      case 2:
        return (
          <Stack gap="xs">
            <Stack gap="xs">
              <h2 className="text-base font-semibold text-foreground">Rent preferences</h2>
              <p className="text-sm text-muted-foreground">Set the budget, duration, and areas you want.</p>
            </Stack>
            <div className="grid gap-3 md:grid-cols-2">
              <FormField label="Min Budget" error={errors['rent_preferences.min_budget']}>
                <Input
                  type="number"
                  inputMode="numeric"
                  id="min_budget"
                  value={formState.rent_preferences.min_budget ?? ''}
                  onChange={(e) =>
                    updateFormState(
                      'rent_preferences',
                      'min_budget',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="e.g., 500"
                />
              </FormField>

              <FormField label="Max Budget" error={errors['rent_preferences.max_budget']}>
                <Input
                  type="number"
                  inputMode="numeric"
                  id="max_budget"
                  value={formState.rent_preferences.max_budget ?? ''}
                  onChange={(e) =>
                    updateFormState(
                      'rent_preferences',
                      'max_budget',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                  placeholder="e.g., 800"
                />
              </FormField>

              <FormField
                label="Min Rent Duration Level"
                error={errors['rent_preferences.min_rent_duration_level']}
              >
                <Select
                  id="min_rent_duration_level"
                  value={formState.rent_preferences.min_rent_duration_level ?? ''}
                  onChange={(e) =>
                    updateFormState(
                      'rent_preferences',
                      'min_rent_duration_level',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                >
                  <option value="">Select...</option>
                  <option value="1">1 month</option>
                  <option value="2">2 months</option>
                  <option value="3">3 months</option>
                  <option value="4">6 months</option>
                  <option value="5">1 year</option>
                </Select>
              </FormField>

              <FormField
                label="Max Rent Duration Level"
                error={errors['rent_preferences.max_rent_duration_level']}
              >
                <Select
                  id="max_rent_duration_level"
                  value={formState.rent_preferences.max_rent_duration_level ?? ''}
                  onChange={(e) =>
                    updateFormState(
                      'rent_preferences',
                      'max_rent_duration_level',
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                >
                  <option value="">Select...</option>
                  <option value="1">1 month</option>
                  <option value="2">2 months</option>
                  <option value="3">3 months</option>
                  <option value="4">6 months</option>
                  <option value="5">1 year</option>
                </Select>
              </FormField>

              <FormField
                label="Room Sharing Level"
                error={errors['rent_preferences.room_sharing_level']}
              >
                <Select
                  id="room_sharing_level"
                  value={formState.rent_preferences.room_sharing_level ?? ''}
                  onChange={(e) =>
                    updateFormState(
                      'rent_preferences',
                      'room_sharing_level',
                      e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : null
                    )
                  }
                >
                  <option value="">Select...</option>
                  <option value="1">Private Room Only</option>
                  <option value="2">Shared Room Possible</option>
                  <option value="3">Flexible (Any Arrangement)</option>
                </Select>
              </FormField>
            </div>

            <FormField
              label="Locations"
              hint="Pick up to 30 distinct areas; overlaps auto-clear."
              error={undefined}
            >
              <Locations
                selectedLocations={formState.rent_preferences.locations as string[]}
                onLocationsChange={(newLocations) => updateFormState('rent_preferences', 'locations', newLocations)}
                error={locationsApiError || errors['rent_preferences.locations']}
                onClearError={clearLocationsApiError}
              />
            </FormField>
          </Stack>
        )
      default:
        return <div>Unknown Step</div>
    }
  }


  // --- RENDER ---
  const progress = ((currentStep + 1) / STEPS.length) * 100

  return (
    <Section as="div" className="bg-surface-muted" fullWidth>
      <div className="page-shell">
        <Card className="mx-auto w-full max-w-4xl rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]">
          <CardContent className="p-4 sm:p-6">
            <Stack gap="sm">
              <Stack gap="xs">
                <p className="text-sm font-medium text-muted-foreground">Profile setup</p>
                <h1 className="text-base font-bold leading-tight text-foreground">Wrap up your flatmate profile</h1>
              </Stack>

              <div className="space-y-2 rounded-[var(--radius-lg)] bg-brand-weak/40 p-3">
                <div className="flex items-center gap-3 text-sm font-medium text-foreground">
                  {STEPS.map((step, index) => {
                    const isPast = index < currentStep
                    const isActive = index === currentStep
                    return (
                      <span
                        key={step.id}
                        className={
                          isActive
                            ? 'text-primary'
                            : isPast
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }
                      >
                        {index + 1}. {step.name}
                      </span>
                    )
                  })}
                </div>
                <div className="h-1 w-full rounded-full bg-border">
                  <div
                    className="h-1 rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${progress}%` }}
                    aria-hidden
                  />
                </div>
              </div>

              {generalError && <Alert variant="destructive">Error: {generalError}</Alert>}
              {apiError && <Alert variant="destructive">API Error: {apiError}</Alert>}

              <div className="rounded-[var(--radius-lg)] bg-card p-3 shadow-[var(--shadow-soft)]">
                {getStepContent()}
              </div>

              <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="sm:w-auto">
                  Back
                </Button>
                {currentStep < STEPS.length - 1 ? (
                  <Button onClick={nextStep} className="sm:w-auto">
                    Continue
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={isLoading} className="sm:w-auto">
                    {isLoading ? 'Submitting…' : 'Finish profile'}
                  </Button>
                )}
              </div>
            </Stack>
          </CardContent>
        </Card>
      </div>
    </Section>
  )
}
