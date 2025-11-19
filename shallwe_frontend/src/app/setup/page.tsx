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
import { cn } from '@/lib/utils'


// Dividing visual flow in steps for better UX
const STEPS = [
  { id: 'profile', name: 'Basic Info' },
  { id: 'about', name: 'About You' },
  { id: 'preferences', name: 'Rent Preferences' },
]

const fieldControlClass =
  'h-11 w-full rounded-lg border border-border/70 bg-card px-3 text-sm text-foreground shadow-sm placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60'

const textareaControlClass =
  'w-full rounded-lg border border-border/70 bg-card px-3 py-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-60'

const tagInputWrapperClass = 'rounded-lg border border-border/70 bg-card px-3 py-2'

const tagInputClassNames = {
  tag: 'rounded-md bg-primary/10 px-2 py-1 text-sm text-primary',
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
    const validationError = validators[validatorKey](tagsToValidate, formState);
    setErrors(prevErrors => {
      const newErrors = { ...prevErrors };
      if (validationError !== null) {
        newErrors[fieldName] = validationError;
      } else {
        delete newErrors[fieldName]; // Clear error if validation passes
      }
      return newErrors;
    });
    return validationError
  };


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
    setErrors(validation.errors)
    return validation.isValid
  }


  const validateAllFields = (): ValidationResult => {
    // Validate all fields for final submission
    const allFields = [...STEP_0_FIELDS_TO_VALIDATE, ...STEP_1_FIELDS_TO_VALIDATE, ...STEP_2_FIELDS_VALIDATE]
    const validation: ValidationResult = validateProfileCreateFields(formState, allFields)
    setErrors(validation.errors)
    return validation
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
          <Stack gap="lg">
            <h2 className="text-xl font-semibold text-foreground">Profile Details</h2>
            <FormField
              label="Name (Cyrillic only)"
              error={errors['profile.name']}
              required
            >
              <input
                type="text"
                id="name"
                value={formState.profile.name ?? ''}
                onChange={(e) => updateFormState('profile', 'name', e.target.value || null)}
                className="w-full rounded-md border border-border bg-card p-3 text-sm focus:border-primary focus:ring-primary"
              />
            </FormField>

            <FormField
              label="Profile Photo"
              description="Square images crop best."
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
          <Stack gap="lg">
            <h2 className="text-xl font-semibold text-foreground">About You</h2>

            <FormField label="Birth Date" error={errors['about.birth_date']} required>
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
                  <label key={option.id} htmlFor={option.id} className="flex items-center gap-2 text-sm text-muted">
                    <input
                      id={option.id}
                      name="gender"
                      type="radio"
                      checked={formState.about.gender === option.value}
                      onChange={() => updateFormState('about', 'gender', option.value as 1 | 2)}
                      className="h-4 w-4 border-border text-primary focus:ring-primary"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </FormField>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Applying as a couple" error={errors['about.is_couple']}>
                <label htmlFor="is_couple" className="flex items-center gap-2 text-sm text-muted">
                  <input
                    id="is_couple"
                    type="checkbox"
                    checked={formState.about.is_couple === true}
                    onChange={(e) => updateFormState('about', 'is_couple', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Yes, we’re a couple
                </label>
              </FormField>

              <FormField label="Children living with you" error={errors['about.has_children']}>
                <label htmlFor="has_children" className="flex items-center gap-2 text-sm text-muted">
                  <input
                    id="has_children"
                    type="checkbox"
                    checked={formState.about.has_children === true}
                    onChange={(e) => updateFormState('about', 'has_children', e.target.checked)}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  Kids live with me
                </label>
              </FormField>
            </div>

            {/* Optional Fields Accordion */}
            <Card className="border border-border/70">
              <button
                type="button"
                onClick={() => setIsAboutAccordionOpen(!isAboutAccordionOpen)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-card/80 focus:outline-none"
              >
                <span>Optional Details</span>
                <svg
                  className={cn('h-5 w-5 text-muted transition-transform', isAboutAccordionOpen && 'rotate-180')}
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
                <CardContent className="stack stack-lg border-t border-border/60 px-4 py-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Occupation Type" error={errors['about.occupation_type']}>
                      <select
                        id="occupation_type"
                        value={formState.about.occupation_type ?? ''}
                        onChange={(e) =>
                          updateFormState(
                            'about',
                            'occupation_type',
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3 | 4) : null
                          )
                        }
                        className={fieldControlClass}
                      >
                        <option value="">Select...</option>
                        <option value="1">Employed</option>
                        <option value="2">Student</option>
                        <option value="3">Unemployed</option>
                        <option value="4">Retired</option>
                      </select>
                    </FormField>

                    <FormField label="Drinking Level" error={errors['about.drinking_level']}>
                      <select
                        id="drinking_level"
                        value={formState.about.drinking_level ?? ''}
                        onChange={(e) =>
                          updateFormState(
                            'about',
                            'drinking_level',
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3 | 4) : null
                          )
                        }
                        className={fieldControlClass}
                      >
                        <option value="">Select...</option>
                        <option value="1">Never</option>
                        <option value="2">Rarely</option>
                        <option value="3">Socially</option>
                        <option value="4">Often</option>
                      </select>
                    </FormField>

                    <FormField label="Smoking Level" error={errors['about.smoking_level']}>
                      <select
                        id="smoking_level"
                        value={formState.about.smoking_level ?? ''}
                        onChange={(e) =>
                          updateSmokingLevelAndClearTypes(
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3 | 4) : null
                          )
                        }
                        className={fieldControlClass}
                      >
                        <option value="">Select...</option>
                        <option value="1">Never</option>
                        <option value="2">Rarely</option>
                        <option value="3">Socially</option>
                        <option value="4">Often</option>
                      </select>
                    </FormField>
                  </div>

                  {formState.about.smoking_level !== null && formState.about.smoking_level > 1 && (
                    <FormField label="Smoking Types" hint="Select all that apply">
                      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-4">
                        {smokingTypeOptions.map((item) => (
                          <label key={item.id} htmlFor={item.id} className="flex items-center gap-2 text-sm text-muted">
                            <input
                              id={item.id}
                              type="checkbox"
                              checked={formState.about[item.field] === true}
                              onChange={(e) => updateFormState('about', item.field, e.target.checked)}
                              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                            />
                            {item.label}
                          </label>
                        ))}
                      </div>
                    </FormField>
                  )}

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField label="Neighbourliness Level" error={errors['about.neighbourliness_level']}>
                      <select
                        id="neighbourliness_level"
                        value={formState.about.neighbourliness_level ?? ''}
                        onChange={(e) =>
                          updateFormState(
                            'about',
                            'neighbourliness_level',
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : null
                          )
                        }
                        className={fieldControlClass}
                      >
                        <option value="">Select...</option>
                        <option value="1">Low</option>
                        <option value="2">Medium</option>
                        <option value="3">High</option>
                      </select>
                    </FormField>

                    <FormField label="Guests Level" error={errors['about.guests_level']}>
                      <select
                        id="guests_level"
                        value={formState.about.guests_level ?? ''}
                        onChange={(e) =>
                          updateFormState(
                            'about',
                            'guests_level',
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : null
                          )
                        }
                        className={fieldControlClass}
                      >
                        <option value="">Select...</option>
                        <option value="1">Low</option>
                        <option value="2">Medium</option>
                        <option value="3">High</option>
                      </select>
                    </FormField>

                    <FormField label="Parties Level" error={errors['about.parties_level']}>
                      <select
                        id="parties_level"
                        value={formState.about.parties_level ?? ''}
                        onChange={(e) =>
                          updateFormState(
                            'about',
                            'parties_level',
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : null
                          )
                        }
                        className={fieldControlClass}
                      >
                        <option value="">Select...</option>
                        <option value="1">Low</option>
                        <option value="2">Medium</option>
                        <option value="3">High</option>
                      </select>
                    </FormField>

                    <FormField label="Bedtime Level" error={errors['about.bedtime_level']}>
                      <select
                        id="bedtime_level"
                        value={formState.about.bedtime_level ?? ''}
                        onChange={(e) =>
                          updateFormState(
                            'about',
                            'bedtime_level',
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3 | 4) : null
                          )
                        }
                        className={fieldControlClass}
                      >
                        <option value="">Select...</option>
                        <option value="1">Early (e.g., 22:00)</option>
                        <option value="2">Midnight</option>
                        <option value="3">Late (e.g., 02:00)</option>
                        <option value="4">Very Late (e.g., 04:00)</option>
                      </select>
                    </FormField>

                    <FormField label="Neatness Level" error={errors['about.neatness_level']}>
                      <select
                        id="neatness_level"
                        value={formState.about.neatness_level ?? ''}
                        onChange={(e) =>
                          updateFormState(
                            'about',
                            'neatness_level',
                            e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : null
                          )
                        }
                        className={fieldControlClass}
                      >
                        <option value="">Select...</option>
                        <option value="1">Low</option>
                        <option value="2">Medium</option>
                        <option value="3">High</option>
                      </select>
                    </FormField>
                  </div>

                  <FormField label="I Have Animals" hint="Check all that apply">
                    <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                      {animalOptions.map((animal) => (
                        <label key={animal.id} htmlFor={animal.id} className="flex items-center gap-2 text-sm text-muted">
                          <input
                            id={animal.id}
                            type="checkbox"
                            checked={formState.about[animal.field] === true}
                            onChange={(e) => updateFormState('about', animal.field, e.target.checked)}
                            className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                          />
                          {animal.label}
                        </label>
                      ))}
                    </div>
                  </FormField>

                  <FormField
                    label="Other Animals (up to 5)"
                    error={errors['about.other_animals']}
                    hint="Type a word and press Enter to add it."
                  >
                    <div className={tagInputWrapperClass}>
                      <TagsInput
                        isEditOnRemove
                        value={formState.about.other_animals || []}
                        beforeAddValidate={(newTag: string, currentTags: string[]) => {
                          const newTagsCandidate = [...currentTags, newTag];
                          const validationError = validators['about.other_animals'](newTagsCandidate, formState);
                          if (validationError !== null) {
                            setErrors(prevErrors => ({
                              ...prevErrors,
                              'about.other_animals': validationError
                            }));
                            return false;
                          }
                          setErrors(prevErrors => {
                            const newErrors = { ...prevErrors };
                            delete newErrors['about.other_animals'];
                            return newErrors;
                          });
                          return true;
                        }}
                        onChange={(tags: string[]) => {
                          setErrors(prevErrors => {
                            const newErrors = { ...prevErrors };
                            delete newErrors['about.other_animals'];
                            return newErrors;
                          });
                          updateFormState('about', 'other_animals', tags);
                        }}
                        onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          const inputValue = (e.target as HTMLInputElement).value;
                          const currentTags = formState.about.other_animals || [];
                          if (inputValue) {
                            const newTagsCandidate = [...currentTags, inputValue];
                            validateCurrentTagsInput('about.other_animals', newTagsCandidate, 'about.other_animals');
                          } else {
                            validateCurrentTagsInput('about.other_animals', currentTags, 'about.other_animals');
                          }
                        }}
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                          const inputElement = e.target as HTMLInputElement
                          const inputValue = inputElement.value
                          if (inputValue) {
                            inputElement.value = ''
                            setErrors(prevErrors => {
                              const newErrors = { ...prevErrors };
                              delete newErrors['about.other_animals'];
                              return newErrors;
                            })
                          }
                        }}
                        name="other_animals"
                        placeHolder="Type and press enter"
                        classNames={tagInputClassNames}
                      />
                    </div>
                  </FormField>

                  <FormField
                    label="Interests (up to 5)"
                    error={errors['about.interests']}
                    hint="Type and press Enter to add hobbies."
                  >
                    <div className={tagInputWrapperClass}>
                      <TagsInput
                        isEditOnRemove
                        value={formState.about.interests || []}
                        beforeAddValidate={(newTag: string, currentTags: string[]) => {
                          const newTagsCandidate = [...currentTags, newTag];
                          const validationError = validators['about.interests'](newTagsCandidate, formState);
                          if (validationError !== null) {
                            setErrors(prevErrors => ({
                              ...prevErrors,
                              'about.interests': validationError
                            }));
                            return false;
                          }

                          setErrors(prevErrors => {
                            const newErrors = { ...prevErrors };
                            delete newErrors['about.interests'];
                            return newErrors;
                          });
                          return true;
                        }}
                        onChange={(tags) => {
                          setErrors(prevErrors => {
                            const newErrors = { ...prevErrors };
                            delete newErrors['about.interests'];
                            return newErrors;
                          });
                          updateFormState('about', 'interests', tags)
                        }}
                        onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          const inputValue = (e.target as HTMLInputElement).value;
                          const currentTags = formState.about.interests || [];
                          if (inputValue) {
                            const newTagsCandidate = [...currentTags, inputValue];
                            validateCurrentTagsInput('about.interests', newTagsCandidate, 'about.interests');
                          }
                          else {
                            validateCurrentTagsInput('about.interests', currentTags, 'about.interests');
                          }
                        }}
                        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                          const inputElement = e.target as HTMLInputElement
                          const inputValue = inputElement.value
                          if (inputValue) {
                            inputElement.value = ''
                            setErrors(prevErrors => {
                              const newErrors = { ...prevErrors };
                              delete newErrors['about.interests'];
                              return newErrors;
                            })
                          }
                        }}
                        name="interests"
                        placeHolder="Type and press enter"
                        classNames={tagInputClassNames}
                      />
                    </div>
                  </FormField>

                  <FormField label="Bio (up to 1024 chars)" error={errors['about.bio']}>
                    <textarea
                      id="bio"
                      rows={3}
                      value={formState.about.bio ?? ''}
                      onChange={(e) => updateFormState('about', 'bio', e.target.value || null)}
                      className={cn(
                        textareaControlClass,
                        (errors['about.bio'] || (formState.about.bio && formState.about.bio.length > 1024)) &&
                          'ring-2 ring-destructive/70'
                      )}
                    />
                    <p
                      className={cn(
                        'text-xs',
                        formState.about.bio && formState.about.bio.length > 1024 ? 'text-destructive' : 'text-muted'
                      )}
                    >
                      {formState.about.bio ? formState.about.bio.length : 0} / 1024 characters
                    </p>
                  </FormField>
                </CardContent>
              )}
            </Card>
            {/* End of Optional Fields Accordion */}

          </Stack>
        )
      
      // Step 3 Rent
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Rent Preferences</h2>
            {/* Add fields for rent_preferences section: budgets, duration, room sharing, locations */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="min_budget" className="block text-sm font-medium text-muted">
                  Min Budget
                </label>
                <input
                  type="number"
                  id="min_budget"
                  value={formState.rent_preferences.min_budget ?? ''} // Use ?? '' to handle null
                  onChange={(e) => updateFormState('rent_preferences', 'min_budget', e.target.value ? Number(e.target.value) : null)}
                  className={`mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                    errors['rent_preferences.min_budget'] ? 'border-destructive' : ''
                  }`}
                />
                {errors['rent_preferences.min_budget'] && <p className="mt-1 text-sm text-destructive">{errors['rent_preferences.min_budget']}</p>}
              </div>
              <div>
                <label htmlFor="max_budget" className="block text-sm font-medium text-muted">
                  Max Budget
                </label>
                <input
                  type="number"
                  id="max_budget"
                  value={formState.rent_preferences.max_budget ?? ''} // Use ?? '' to handle null
                  onChange={(e) => updateFormState('rent_preferences', 'max_budget', e.target.value ? Number(e.target.value) : null)}
                  className={`mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                    errors['rent_preferences.max_budget'] ? 'border-destructive' : ''
                  }`}
                />
                {errors['rent_preferences.max_budget'] && <p className="mt-1 text-sm text-destructive">{errors['rent_preferences.max_budget']}</p>}
              </div>
            </div>
            {/* Add other 'rent_preferences' fields similarly */}
            {/* min_rent_duration_level (select) */}
            <div>
                <label htmlFor="min_rent_duration_level" className="block text-sm font-medium text-muted">
                  Min Rent Duration Level
                </label>
                <select
                  id="min_rent_duration_level"
                  value={formState.rent_preferences.min_rent_duration_level ?? ''} // Use ?? '' to handle null
                  onChange={(e) => updateFormState('rent_preferences', 'min_rent_duration_level', e.target.value ? Number(e.target.value) : null)}
                  className={`mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                    errors['rent_preferences.min_rent_duration_level'] ? 'border-destructive' : ''
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                </select>
                {errors['rent_preferences.min_rent_duration_level'] && <p className="mt-1 text-sm text-destructive">{errors['rent_preferences.min_rent_duration_level']}</p>}
            </div>

            {/* max_rent_duration_level (select) */}
            <div>
                <label htmlFor="max_rent_duration_level" className="block text-sm font-medium text-muted">
                  Max Rent Duration Level
                </label>
                <select
                  id="max_rent_duration_level"
                  value={formState.rent_preferences.max_rent_duration_level ?? ''} // Use ?? '' to handle null
                  onChange={(e) => updateFormState('rent_preferences', 'max_rent_duration_level', e.target.value ? Number(e.target.value) : null)}
                  className={`mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                    errors['rent_preferences.max_rent_duration_level'] ? 'border-destructive' : ''
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                </select>
                {errors['rent_preferences.max_rent_duration_level'] && <p className="mt-1 text-sm text-destructive">{errors['rent_preferences.max_rent_duration_level']}</p>}
            </div>

            {/* room_sharing_level (select) - Add this block */}
            <div>
                <label htmlFor="room_sharing_level" className="block text-sm font-medium text-muted">
                  Room Sharing Level
                </label>
                <select
                  id="room_sharing_level"
                  value={formState.rent_preferences.room_sharing_level ?? ''} // Use ?? '' to handle null
                  onChange={(e) => updateFormState('rent_preferences', 'room_sharing_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 : null)} // Assuming 1 | 2 | 3 based on API spec for rent_preferences
                  className={`mt-1 block w-full rounded-md border-border shadow-sm focus:border-primary focus:ring-primary sm:text-sm ${
                    errors['rent_preferences.room_sharing_level'] ? 'border-destructive' : ''
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="1">Private Room Only</option>
                  <option value="2">Shared Room Possible</option>
                  <option value="3">Flexible (Any Arrangement)</option>
                </select>
                {errors['rent_preferences.room_sharing_level'] && <p className="mt-1 text-sm text-destructive">{errors['rent_preferences.room_sharing_level']}</p>}
            </div>
            {/* End of room_sharing_level field */}

            {/* Add Location Search Component */}
            <div>
                <label className="block text-sm font-medium text-muted">
                  Locations (Select up to 30, no overlaps)
                </label>
                <Locations
                    selectedLocations={formState.rent_preferences.locations as string[]} 
                    onLocationsChange={(newLocations) => updateFormState('rent_preferences', 'locations', newLocations)}
                    error={locationsApiError || errors['rent_preferences.locations']} // Pass error from main validator or specific API error
                    onClearError={clearLocationsApiError} // Pass function to clear the specific API error
                />
            </div>
            {/* End of Location Search Component */}
          </div>
        )
      default:
        return <div>Unknown Step</div>
    }
  }


  // --- RENDER ---
  return (
    <Section as="div" className="min-h-screen bg-background-soft/60 py-12" fullWidth>
      <Card className="mx-auto w-full max-w-3xl">
        <CardContent className="space-y-8 p-6 sm:p-8">
          <Stack gap="sm" className="text-center">
            <h1 className="text-2xl font-semibold text-foreground">Set Up Your Profile</h1>
            <p className="text-sm text-muted">
              Complete a few quick sections so we can match you with compatible roommates.
            </p>
          </Stack>

          <nav aria-label="Progress" className="overflow-x-auto">
            <ol className="flex items-center gap-4 text-sm font-medium">
              {STEPS.map((step, index) => {
                const isPast = index < currentStep
                const isActive = index === currentStep
                return (
                  <li key={step.id} className="flex items-center gap-2">
                    <span
                      className={
                        isActive
                          ? 'text-primary'
                          : isPast
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                      }
                    >
                      {step.name}
                    </span>
                    {index !== STEPS.length - 1 && (
                      <span className="h-px w-6 bg-border opacity-70" aria-hidden="true" />
                    )}
                  </li>
                )
              })}
            </ol>
          </nav>

          {generalError && <Alert variant="destructive">Error: {generalError}</Alert>}
          {apiError && <Alert variant="destructive">API Error: {apiError}</Alert>}

          {getStepContent()}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={prevStep} disabled={currentStep === 0} className="sm:w-auto">
              Back
            </Button>
            {currentStep < STEPS.length - 1 ? (
              <Button onClick={nextStep} className="sm:w-auto">
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isLoading} className="sm:w-auto">
                {isLoading ? 'Creating Profile…' : 'Create Profile'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </Section>
  )
}
