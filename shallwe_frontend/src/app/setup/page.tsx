'use client'


import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import {
  DisplayNameField,
  ProfilePhotoField,
  BirthDateField,
  GenderField,
  CoupleField,
  ChildrenField,
  SmokingLevelField,
  SmokingTypesField,
  AnimalsOwnedField,
  OtherAnimalsTagsField,
  InterestsTagsField,
  BioField,
  BudgetRangeField,
  RentDurationRangeField,
  RoomSharingLevelField,
  LocationsField,
  OccupationField,
  DrinkingLevelField,
  NeighbourlinessLevelField,
  GuestsLevelField,
  PartiesLevelField,
  BedtimeLevelField,
  NeatnessLevelField,
} from '../components/fields'
import {
  ABOUT_FIELDS_TO_VALIDATE,
  PROFILE_FIELDS_TO_VALIDATE,
  RENT_PREFERENCES_FIELDS_TO_VALIDATE,
  SETUP_STEP_0_FIELDS_TO_VALIDATE,
  SETUP_STEP_1_FIELDS_TO_VALIDATE,
  SETUP_STEP_2_FIELDS_TO_VALIDATE,
} from '../components/fields/validationFieldLists'
import { applySmokingLevelReset, ensureSmokingLevelBeforeTypes } from '../components/fields/smokingHelpers'

import { env } from '@/config/env'
import { getDocumentCookie } from '@/lib/common/cookie'
import { ProfileCreateFormState, profileCreateFormStateInitial } from '@/lib/shallwe/profile/formstates/states' 
import { collectProfileCreateDataFromState } from '@/lib/shallwe/profile/formstates/collectors/create'
import { validateProfileCreateFields } from '@/lib/shallwe/profile/formstates/validators/create'
import { ValidationResult, validators } from '@/lib/shallwe/profile/formstates/validators/common'
import { ProfileCreateData } from '@/lib/shallwe/profile/api/schema/create'
import { createProfile } from '@/lib/shallwe/profile/api/calls'
import { ApiError } from '@/lib/shallwe/common/api/calls'
import { Button } from '@/app/components/ui/primitives/button'
import { Card, CardContent } from '@/app/components/ui/primitives/card'
import { Alert } from '@/app/components/ui/primitives/alert'
import { Section } from '@/app/components/ui/primitives/section'
import { Stack } from '@/app/components/ui/primitives/stack'
import { cn } from '@/lib/utils'


// Dividing visual flow in steps for better UX
const STEPS = [
  { id: 'profile', name: 'Basic Info' },
  { id: 'about', name: 'About You' },
  { id: 'preferences', name: 'Rent Preferences' },
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


  const updateSmokingLevelAndClearTypes = (newLevel: ProfileCreateFormState['about']['smoking_level']) => {
    setGeneralError(null)
    setFormState(prev => ({
      ...prev,
      about: applySmokingLevelReset(prev.about, newLevel),
    }))

    if (errors['about.smoking_level']) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors['about.smoking_level']
        return newErrors
      })
    }
  }
  

  // Update the photo handler to interact with the PhotoCropper component
  const handlePhotoCropped = (croppedFile: File) => {
    updateFormState('profile', 'photo', croppedFile)
  }

  const ensureSmokingLevelBeforeTypesLocal = (errorsMap: Record<string, string>) =>
    ensureSmokingLevelBeforeTypes(formState.about, errorsMap)

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
        fieldsToValidate = [...SETUP_STEP_0_FIELDS_TO_VALIDATE]
        break
      case 1:
        fieldsToValidate = [...SETUP_STEP_1_FIELDS_TO_VALIDATE]
        break
      case 2:
        fieldsToValidate = [...SETUP_STEP_2_FIELDS_TO_VALIDATE]
        break
      default:
        fieldsToValidate = []
    }

    const validation: ValidationResult = validateProfileCreateFields(formState, fieldsToValidate)
    const nextErrors = { ...validation.errors }
    const smokingOk = ensureSmokingLevelBeforeTypesLocal(nextErrors)
    setErrors(nextErrors)
    return validation.isValid && smokingOk
  }


  const validateAllFields = (): ValidationResult => {
    // Validate all fields for final submission
    const allFields = [
      ...PROFILE_FIELDS_TO_VALIDATE,
      ...ABOUT_FIELDS_TO_VALIDATE,
      ...RENT_PREFERENCES_FIELDS_TO_VALIDATE,
    ]
    const validation: ValidationResult = validateProfileCreateFields(formState, allFields)
    const nextErrors = { ...validation.errors }
    const smokingOk = ensureSmokingLevelBeforeTypesLocal(nextErrors)
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
        fieldName => !SETUP_STEP_2_FIELDS_TO_VALIDATE.includes(fieldName as (typeof SETUP_STEP_2_FIELDS_TO_VALIDATE)[number])
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
            <DisplayNameField
              value={formState.profile.name}
              error={errors['profile.name']}
              onChange={(val) => updateFormState('profile', 'name', val)}
              onErrorClear={() => {
                if (errors['profile.name']) setErrors((prev) => { const n={...prev}; delete n['profile.name']; return n })
              }}
            />

            <ProfilePhotoField
              value={formState.profile.photo}
              error={errors['profile.photo']}
              onError={handlePhotoError}
              onClearError={clearPhotoError}
              onChange={handlePhotoCropped}
            />
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

            <BirthDateField
              value={formState.about.birth_date}
              error={errors['about.birth_date']}
              onChange={(val) => updateFormState('about', 'birth_date', val)}
              onErrorClear={() => {
                if (errors['about.birth_date']) setErrors((prev) => { const n={...prev}; delete n['about.birth_date']; return n })
              }}
            />

            <GenderField
              value={formState.about.gender as 1 | 2 | null}
              error={errors['about.gender']}
              onChange={(val) => updateFormState('about', 'gender', val)}
              onErrorClear={() => {
                if (errors['about.gender']) setErrors((prev) => { const n={...prev}; delete n['about.gender']; return n })
              }}
            />

            <div className="grid gap-3 md:grid-cols-2">
              <CoupleField
                value={formState.about.is_couple === true}
                error={errors['about.is_couple']}
                onChange={(val) => updateFormState('about', 'is_couple', val)}
                onErrorClear={() => {
                  if (errors['about.is_couple']) setErrors((prev) => { const n={...prev}; delete n['about.is_couple']; return n })
                }}
              />

              <ChildrenField
                value={formState.about.has_children === true}
                error={errors['about.has_children']}
                onChange={(val) => updateFormState('about', 'has_children', val)}
                onErrorClear={() => {
                  if (errors['about.has_children']) setErrors((prev) => { const n={...prev}; delete n['about.has_children']; return n })
                }}
              />
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
                    <OccupationField
                      value={formState.about.occupation_type}
                      error={errors['about.occupation_type']}
                      onChange={(val) => updateFormState('about', 'occupation_type', val)}
                      onErrorClear={() => {
                        if (errors['about.occupation_type']) setErrors((prev) => { const n={...prev}; delete n['about.occupation_type']; return n })
                      }}
                    />

                    <DrinkingLevelField
                      value={formState.about.drinking_level}
                      error={errors['about.drinking_level']}
                      onChange={(val) => updateFormState('about', 'drinking_level', val)}
                      onErrorClear={() => {
                        if (errors['about.drinking_level']) setErrors((prev) => { const n={...prev}; delete n['about.drinking_level']; return n })
                      }}
                    />

                    <NeighbourlinessLevelField
                      value={formState.about.neighbourliness_level}
                      error={errors['about.neighbourliness_level']}
                      onChange={(val) => updateFormState('about', 'neighbourliness_level', val)}
                      onErrorClear={() => {
                        if (errors['about.neighbourliness_level']) setErrors((prev) => { const n={...prev}; delete n['about.neighbourliness_level']; return n })
                      }}
                    />

                    <GuestsLevelField
                      value={formState.about.guests_level}
                      error={errors['about.guests_level']}
                      onChange={(val) => updateFormState('about', 'guests_level', val)}
                      onErrorClear={() => {
                        if (errors['about.guests_level']) setErrors((prev) => { const n={...prev}; delete n['about.guests_level']; return n })
                      }}
                    />

                    <PartiesLevelField
                      value={formState.about.parties_level}
                      error={errors['about.parties_level']}
                      onChange={(val) => updateFormState('about', 'parties_level', val)}
                      onErrorClear={() => {
                        if (errors['about.parties_level']) setErrors((prev) => { const n={...prev}; delete n['about.parties_level']; return n })
                      }}
                    />

                    <BedtimeLevelField
                      value={formState.about.bedtime_level}
                      error={errors['about.bedtime_level']}
                      onChange={(val) => updateFormState('about', 'bedtime_level', val)}
                      onErrorClear={() => {
                        if (errors['about.bedtime_level']) setErrors((prev) => { const n={...prev}; delete n['about.bedtime_level']; return n })
                      }}
                    />

                    <NeatnessLevelField
                      value={formState.about.neatness_level}
                      error={errors['about.neatness_level']}
                      onChange={(val) => updateFormState('about', 'neatness_level', val)}
                      onErrorClear={() => {
                        if (errors['about.neatness_level']) setErrors((prev) => { const n={...prev}; delete n['about.neatness_level']; return n })
                      }}
                    />

                    <SmokingLevelField
                      value={formState.about.smoking_level}
                      error={errors['about.smoking_level']}
                      onChange={(val) => updateSmokingLevelAndClearTypes(val)}
                      onErrorClear={() => {
                        if (errors['about.smoking_level']) setErrors((prev) => { const n={...prev}; delete n['about.smoking_level']; return n })
                      }}
                    />

                    <SmokingTypesField
                      value={{
                        smokes_iqos: formState.about.smokes_iqos,
                        smokes_vape: formState.about.smokes_vape,
                        smokes_tobacco: formState.about.smokes_tobacco,
                        smokes_cigs: formState.about.smokes_cigs,
                      }}
                      smokingLevel={formState.about.smoking_level}
                      error={errors['about.smoking_level']}
                      onChange={(field, checked) =>
                        updateFormState(
                          'about',
                          field as keyof ProfileCreateFormState['about'],
                          checked as ProfileCreateFormState['about'][typeof field]
                        )
                      }
                      onErrorClear={() => {
                        if (errors['about.smoking_level']) setErrors((prev) => { const n={...prev}; delete n['about.smoking_level']; return n })
                      }}
                    />

                    <AnimalsOwnedField
                      value={{
                        has_cats: formState.about.has_cats,
                        has_dogs: formState.about.has_dogs,
                        has_reptiles: formState.about.has_reptiles,
                        has_birds: formState.about.has_birds,
                      }}
                      onChange={(field, checked) =>
                        updateFormState(
                          'about',
                          field as keyof ProfileCreateFormState['about'],
                          checked as ProfileCreateFormState['about'][typeof field]
                        )
                      }
                    />

                    <OtherAnimalsTagsField
                      value={formState.about.other_animals || []}
                      error={errors['about.other_animals']}
                      onChange={(tags) => updateFormState('about', 'other_animals', tags)}
                      validator={(tags) => validators['about.other_animals'](tags, formState)}
                      onErrorClear={() => {
                        if (errors['about.other_animals']) setErrors((prev) => { const n={...prev}; delete n['about.other_animals']; return n })
                      }}
                    />

                    <InterestsTagsField
                      value={formState.about.interests || []}
                      error={errors['about.interests']}
                      onChange={(tags) => updateFormState('about', 'interests', tags)}
                      validator={(tags) => validators['about.interests'](tags, formState)}
                      onErrorClear={() => {
                        if (errors['about.interests']) setErrors((prev) => { const n={...prev}; delete n['about.interests']; return n })
                      }}
                    />

                    <BioField
                      value={formState.about.bio}
                      error={errors['about.bio']}
                      onChange={(val) => updateFormState('about', 'bio', val)}
                      onErrorClear={() => {
                        if (errors['about.bio']) setErrors((prev) => { const n={...prev}; delete n['about.bio']; return n })
                      }}
                    />
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
              <BudgetRangeField
                min={formState.rent_preferences.min_budget}
                max={formState.rent_preferences.max_budget}
                minError={errors['rent_preferences.min_budget']}
                maxError={errors['rent_preferences.max_budget']}
                onChange={(which, val) =>
                  updateFormState(
                    'rent_preferences',
                    which === 'min' ? 'min_budget' : 'max_budget',
                    val
                  )
                }
              />

              <RentDurationRangeField
                min={formState.rent_preferences.min_rent_duration_level}
                max={formState.rent_preferences.max_rent_duration_level}
                minError={errors['rent_preferences.min_rent_duration_level']}
                maxError={errors['rent_preferences.max_rent_duration_level']}
                onChange={(which, val) =>
                  updateFormState(
                    'rent_preferences',
                    which === 'min' ? 'min_rent_duration_level' : 'max_rent_duration_level',
                    val
                  )
                }
              />

              <RoomSharingLevelField
                value={formState.rent_preferences.room_sharing_level}
                error={errors['rent_preferences.room_sharing_level']}
                onChange={(val) => updateFormState('rent_preferences', 'room_sharing_level', val)}
                onErrorClear={() => {
                  if (errors['rent_preferences.room_sharing_level'])
                    setErrors((prev) => { const n={...prev}; delete n['rent_preferences.room_sharing_level']; return n })
                }}
              />
            </div>

            <LocationsField
              value={formState.rent_preferences.locations as string[]}
              error={locationsApiError || errors['rent_preferences.locations']}
              onChange={(locs) => updateFormState('rent_preferences', 'locations', locs)}
              onClearError={clearLocationsApiError}
            />
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

              <div className="space-y-2 rounded-[var(--radius-lg)] bg-brand-weak p-3">
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
