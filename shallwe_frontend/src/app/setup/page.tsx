'use client'


import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

import { TagsInput } from "react-tag-input-component"

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


// Dividing visual flow in steps for better UX
const STEPS = [
  { id: 'profile', name: 'Basic Info' },
  { id: 'about', name: 'About You' },
  { id: 'preferences', name: 'Rent Preferences' },
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
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Profile Details</h2>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name (Cyrillic only)
              </label>
              <input
                type="text"
                id="name"
                value={formState.profile.name ?? ''} // Use ?? '' to handle null
                onChange={(e) => updateFormState('profile', 'name', e.target.value || null)} // Convert empty string back to null if needed, though the ?? '' handles display
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors['profile.name'] ? 'border-red-500' : ''
                }`}
              />
              {errors['profile.name'] && <p className="mt-1 text-sm text-red-600">{errors['profile.name']}</p>}
            </div>

            <div>
              <ProfilePhotoPick
                initialFile={formState.profile.photo} // Pass the current photo if editing
                onError={handlePhotoError}
                onClearError={clearPhotoError}
                onCropComplete={handlePhotoCropped}
                // Removed formState and fieldPath props
              />
              {/* Display central validation error for photo if it exists (e.g., required but not set after crop) */}
              {/* This error will appear if the user proceeds without a valid photo after the component's internal checks */}
              {errors['profile.photo'] && <p className="mt-1 text-sm text-red-600">{errors['profile.photo']}</p>}
            </div>
          </div>
        )
      
      // Step 2 About
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">About You</h2>

            {/* Required fields (birth_date, gender, is_couple, has_children) remain outside the accordion */}
            <BirthDateSelect
              inputId="birth_date"
              currentValue={formState.about.birth_date} // Pass the string value from state
              onChange={(dateString) => updateFormState('about', 'birth_date', dateString)} // Pass the update handler
              error={errors['about.birth_date']} // Pass the error message
              className={`${errors['about.birth_date'] ? 'border-red-500' : ''}`} // Pass specific Tailwind classes if needed
            />

            {/* Gender */}
            <div>
              <fieldset>
                <legend className="text-sm font-medium text-gray-700">Gender</legend>
                <div className="mt-1 space-y-2">
                  {[
                    { id: 'gender_male', value: 1, label: 'Male' },
                    { id: 'gender_female', value: 2, label: 'Female' },
                  ].map((option) => (
                    <div key={option.id} className="flex items-center">
                      <input
                        id={option.id}
                        name="gender"
                        type="radio"
                        checked={formState.about.gender === option.value}
                        onChange={() => updateFormState('about', 'gender', option.value as 1 | 2)}
                        className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor={option.id} className="ml-3 block text-sm text-gray-700">
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
                {errors['about.gender'] && (
                  <p className="mt-1 text-sm text-red-600">{errors['about.gender']}</p>
                )}
              </fieldset>
            </div>

            {/* Is Couple */}
            <div className="flex flex-col mt-2">
              <div className="flex items-center">
                <input
                  id="is_couple"
                  type="checkbox"
                  checked={formState.about.is_couple === true}
                  onChange={(e) => updateFormState('about', 'is_couple', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_couple" className="ml-2 block text-sm text-gray-700">
                  Is Couple
                </label>
              </div>
              {errors['about.is_couple'] && (
                <p className="mt-1 text-sm text-red-600">{errors['about.is_couple']}</p>
              )}
            </div>

            {/* Has Children */}
            <div className="flex flex-col mt-2">
              <div className="flex items-center">
                <input
                  id="has_children"
                  type="checkbox"
                  checked={formState.about.has_children === true}
                  onChange={(e) => updateFormState('about', 'has_children', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="has_children" className="ml-2 block text-sm text-gray-700">
                  Has Children
                </label>
              </div>
              {errors['about.has_children'] && (
                <p className="mt-1 text-sm text-red-600">{errors['about.has_children']}</p>
              )}
            </div>

            {/* Optional Fields Accordion */}
            <div className="border border-gray-200 rounded-md">
              <button
                type="button"
                onClick={() => setIsAboutAccordionOpen(!isAboutAccordionOpen)}
                className="w-full flex justify-between items-center p-4 text-left focus:outline-none"
              >
                <span className="text-sm font-medium text-gray-700">Optional Details</span>
                <svg
                  className={`h-5 w-5 text-gray-400 transform ${isAboutAccordionOpen ? 'rotate-180' : ''}`}
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
                <div className="p-4 space-y-4 border-t border-gray-200">
                  {/* occupation_type (select) */}
                  <div>
                    <label htmlFor="occupation_type" className="block text-sm font-medium text-gray-700">
                      Occupation Type
                    </label>
                    <select
                      id="occupation_type"
                      value={formState.about.occupation_type ?? ''}
                      onChange={(e) => updateFormState('about', 'occupation_type', e.target.value ? Number(e.target.value) as 1 | 2 | 3 | 4 : null)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors['about.occupation_type'] ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="1">Employed</option>
                      <option value="2">Student</option>
                      <option value="3">Unemployed</option>
                      <option value="4">Retired</option>
                    </select>
                    {errors['about.occupation_type'] && <p className="mt-1 text-sm text-red-600">{errors['about.occupation_type']}</p>}
                  </div>

                  {/* drinking_level (select) */}
                  <div>
                    <label htmlFor="drinking_level" className="block text-sm font-medium text-gray-700">
                      Drinking Level
                    </label>
                    <select
                      id="drinking_level"
                      value={formState.about.drinking_level ?? ''}
                      onChange={(e) => updateFormState('about', 'drinking_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 | 4 : null)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors['about.drinking_level'] ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="1">Never</option>
                      <option value="2">Rarely</option>
                      <option value="3">Socially</option>
                      <option value="4">Often</option>
                    </select>
                    {errors['about.drinking_level'] && <p className="mt-1 text-sm text-red-600">{errors['about.drinking_level']}</p>}
                  </div>

                  {/* smoking_level (select) */}
                  <div>
                    <label htmlFor="smoking_level" className="block text-sm font-medium text-gray-700">
                      Smoking Level
                    </label>
                    <select
                      id="smoking_level"
                      value={formState.about.smoking_level ?? ''}
                      onChange={(e) => updateSmokingLevelAndClearTypes(e.target.value ? Number(e.target.value) as 1 | 2 | 3 | 4 : null)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors['about.smoking_level'] ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="1">Never</option>
                      <option value="2">Rarely</option>
                      <option value="3">Socially</option>
                      <option value="4">Often</option>
                    </select>
                    {errors['about.smoking_level'] && <p className="mt-1 text-sm text-red-600">{errors['about.smoking_level']}</p>}
                  </div>

                  {/* Smoking Type Checkboxes (Conditional based on smoking_level) */}
                  {formState.about.smoking_level !== null && formState.about.smoking_level > 1 && (
                    <div className="col-span-2 mt-2"> {/* Use col-span-2 to span full width, add top margin */}
                      <p className="text-sm font-medium text-gray-700 mb-1">Smoking Types:</p> {/* Label for the group */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2"> {/* Grid layout: 1 column on mobile, 2 on small screens, 4 on medium+ screens */}
                        <div className="flex items-center">
                          <input
                            id="smokes_iqos"
                            type="checkbox"
                            checked={formState.about.smokes_iqos === true}
                            onChange={(e) => updateFormState('about', 'smokes_iqos', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor="smokes_iqos" className="ml-2 block text-sm text-gray-700">
                            IQOS
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="smokes_vape"
                            type="checkbox"
                            checked={formState.about.smokes_vape === true}
                            onChange={(e) => updateFormState('about', 'smokes_vape', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor="smokes_vape" className="ml-2 block text-sm text-gray-700">
                            Vape
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="smokes_tobacco"
                            type="checkbox"
                            checked={formState.about.smokes_tobacco === true}
                            onChange={(e) => updateFormState('about', 'smokes_tobacco', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor="smokes_tobacco" className="ml-2 block text-sm text-gray-700">
                            Tobacco
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            id="smokes_cigs"
                            type="checkbox"
                            checked={formState.about.smokes_cigs === true}
                            onChange={(e) => updateFormState('about', 'smokes_cigs', e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <label htmlFor="smokes_cigs" className="ml-2 block text-sm text-gray-700">
                            Cigarettes
                          </label>
                        </div>
                        </div>
                    </div>
                  )}

                  {/* neighbourliness_level (select) */}
                  <div>
                    <label htmlFor="neighbourliness_level" className="block text-sm font-medium text-gray-700">
                      Neighbourliness Level
                    </label>
                    <select
                      id="neighbourliness_level"
                      value={formState.about.neighbourliness_level ?? ''}
                      onChange={(e) => updateFormState('about', 'neighbourliness_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 : null)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors['about.neighbourliness_level'] ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="1">Low</option>
                      <option value="2">Medium</option>
                      <option value="3">High</option>
                    </select>
                    {errors['about.neighbourliness_level'] && <p className="mt-1 text-sm text-red-600">{errors['about.neighbourliness_level']}</p>}
                  </div>

                  {/* guests_level (select) */}
                  <div>
                    <label htmlFor="guests_level" className="block text-sm font-medium text-gray-700">
                      Guests Level
                    </label>
                    <select
                      id="guests_level"
                      value={formState.about.guests_level ?? ''}
                      onChange={(e) => updateFormState('about', 'guests_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 : null)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors['about.guests_level'] ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="1">Low</option>
                      <option value="2">Medium</option>
                      <option value="3">High</option>
                    </select>
                    {errors['about.guests_level'] && <p className="mt-1 text-sm text-red-600">{errors['about.guests_level']}</p>}
                  </div>

                  {/* parties_level (select) */}
                  <div>
                    <label htmlFor="parties_level" className="block text-sm font-medium text-gray-700">
                      Parties Level
                    </label>
                    <select
                      id="parties_level"
                      value={formState.about.parties_level ?? ''}
                      onChange={(e) => updateFormState('about', 'parties_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 : null)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors['about.parties_level'] ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="1">Low</option>
                      <option value="2">Medium</option>
                      <option value="3">High</option>
                    </select>
                    {errors['about.parties_level'] && <p className="mt-1 text-sm text-red-600">{errors['about.parties_level']}</p>}
                  </div>

                  {/* bedtime_level (select) */}
                  <div>
                    <label htmlFor="bedtime_level" className="block text-sm font-medium text-gray-700">
                      Bedtime Level
                    </label>
                    <select
                      id="bedtime_level"
                      value={formState.about.bedtime_level ?? ''}
                      onChange={(e) => updateFormState('about', 'bedtime_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 | 4 : null)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors['about.bedtime_level'] ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="1">Early (e.g., 22:00)</option>
                      <option value="2">Midnight</option>
                      <option value="3">Late (e.g., 02:00)</option>
                      <option value="4">Very Late (e.g., 04:00)</option>
                    </select>
                    {errors['about.bedtime_level'] && <p className="mt-1 text-sm text-red-600">{errors['about.bedtime_level']}</p>}
                  </div>

                  {/* neatness_level (select) */}
                  <div>
                    <label htmlFor="neatness_level" className="block text-sm font-medium text-gray-700">
                      Neatness Level
                    </label>
                    <select
                      id="neatness_level"
                      value={formState.about.neatness_level ?? ''}
                      onChange={(e) => updateFormState('about', 'neatness_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 : null)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors['about.neatness_level'] ? 'border-red-500' : ''
                      }`}
                    >
                      <option value="">Select...</option>
                      <option value="1">Low</option>
                      <option value="2">Medium</option>
                      <option value="3">High</option>
                    </select>
                    {errors['about.neatness_level'] && <p className="mt-1 text-sm text-red-600">{errors['about.neatness_level']}</p>}
                  </div>

                  {/* Pet Checkboxes */}
                  <div className="col-span-2 mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">I Have Animals:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="col-start-1 flex items-center">
                        <input
                          id="has_cats"
                          type="checkbox"
                          checked={formState.about.has_cats === true}
                          onChange={(e) => updateFormState('about', 'has_cats', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="has_cats" className="ml-2 block text-sm text-gray-700">
                          Has Cats
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="has_dogs"
                          type="checkbox"
                          checked={formState.about.has_dogs === true}
                          onChange={(e) => updateFormState('about', 'has_dogs', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="has_dogs" className="ml-2 block text-sm text-gray-700">
                          Has Dogs
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="has_reptiles"
                          type="checkbox"
                          checked={formState.about.has_reptiles === true}
                          onChange={(e) => updateFormState('about', 'has_reptiles', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="has_reptiles" className="ml-2 block text-sm text-gray-700">
                          Has Reptiles
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="has_birds"
                          type="checkbox"
                          checked={formState.about.has_birds === true}
                          onChange={(e) => updateFormState('about', 'has_birds', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="has_birds" className="ml-2 block text-sm text-gray-700">
                          Has Birds
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* other_animals (text input - comma separated, validated by validator) */}
                  <div>
                    <label htmlFor="other_animals" className="block text-sm font-medium text-gray-700">
                      Other Animals (up to 5)
                    </label>
                    <TagsInput
                      isEditOnRemove
                      value={formState.about.other_animals || []}
                      beforeAddValidate={(newTag: string, currentTags: string[]) => {
                        const newTagsCandidate = [...currentTags, newTag];
                        const validationError = validators['about.other_animals'](newTagsCandidate, formState);
                        // Update the main errors state if validation fails
                        if (validationError !== null) {
                          setErrors(prevErrors => ({
                            ...prevErrors,
                            'about.other_animals': validationError
                          }));
                          return false; // Prevent adding the tag
                        }

                        // Clear the specific error for this field if validation passes
                        setErrors(prevErrors => {
                          const newErrors = { ...prevErrors };
                          delete newErrors['about.other_animals']; // Remove the error for this key
                          return newErrors;
                        });
                        return true; // Allow adding the tag
                      }}
                      onChange={(tags: string[]) => {
                        // Clear the specific error for this field whenever tags change
                        // This happens after a successful add (when beforeAddValidate passed)
                        // or a remove action.
                        setErrors(prevErrors => {
                          const newErrors = { ...prevErrors };
                          delete newErrors['about.other_animals']; // Remove the error for this key
                          return newErrors;
                        });
                        updateFormState('about', 'other_animals', tags);
                      }}
                      onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        const inputValue = (e.target as HTMLInputElement).value;

                        if (inputValue) {
                          const currentTags = formState.about.other_animals || []; // Use current state
                          const newTagsCandidate = [...currentTags, inputValue];
                          validateCurrentTagsInput('about.other_animals', newTagsCandidate, 'about.other_animals');
                        }
                        else {
                          const currentTags = formState.about.other_animals || [];
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
                            delete newErrors['about.other_animals']; // Remove the error for this key
                            return newErrors;
                          })
                        }
                      }}
                      name="other_animals"
                      placeHolder="Type and press enter"
                      classNames={{
                        tag: "bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm",
                        input: "mt-0 block w-full p-0 text-sm focus:outline-none",
                      }}
                    />
                    {errors['about.other_animals'] && <p className="mt-1 text-sm text-red-600">{errors['about.other_animals']}</p>}
                  </div>

                  {/* interests (text input - comma separated, validated by validator) */}
                  <div>
                    <label htmlFor="interests" className="block text-sm font-medium text-gray-700">
                      Interests (up to 5)
                    </label>
                    <TagsInput
                      isEditOnRemove
                      value={formState.about.interests || []}
                      beforeAddValidate={(newTag: string, currentTags: string[]) => {
                        const newTagsCandidate = [...currentTags, newTag];
                        const validationError = validators['about.interests'](newTagsCandidate, formState);
                        // Update the main errors state if validation fails
                        if (validationError !== null) {
                          setErrors(prevErrors => ({
                            ...prevErrors,
                            'about.interests': validationError
                          }));
                          return false; // Prevent adding the tag
                        }

                        // Clear the specific error for this field if validation passes
                        setErrors(prevErrors => {
                          const newErrors = { ...prevErrors };
                          delete newErrors['about.interests']; // Remove the error for this key
                          return newErrors;
                        });
                        return true; // Allow adding the tag
                      }}
                      onChange={(tags) => {
                        setErrors(prevErrors => {
                          const newErrors = { ...prevErrors };
                          delete newErrors['about.interests']; // Remove the error for this key
                          return newErrors;
                        });
                        updateFormState('about', 'interests', tags)
                      }}
                      onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        const inputValue = (e.target as HTMLInputElement).value;

                        if (inputValue) {
                          const currentTags = formState.about.interests || []; // Use current state
                          const newTagsCandidate = [...currentTags, inputValue];
                          validateCurrentTagsInput('about.interests', newTagsCandidate, 'about.interests');
                        }
                        else {
                          const currentTags = formState.about.interests || [];
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
                            delete newErrors['about.interests']; // Remove the error for this key
                            return newErrors;
                          })
                        }
                      }}
                      name="interests"
                      placeHolder="Type and press enter"
                      classNames={{
                        tag: "bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm",
                        input: "mt-0 block w-full p-0 text-sm focus:outline-none",
                      }}
                    />
                    {errors['about.interests'] && <p className="mt-1 text-sm text-red-600">{errors['about.interests']}</p>}
                  </div>

                  {/* bio (textarea) */}
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                      Bio (up to 1024 chars)
                    </label>
                    <textarea
                      id="bio"
                      rows={3}
                      value={formState.about.bio ?? ''}
                      onChange={(e) => updateFormState('about', 'bio', e.target.value || null)}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors['about.bio'] ? 'border-red-500' : // Prioritize validation errors
                        (formState.about.bio && formState.about.bio.length > 1024 ? 'border-red-500' : 'border-gray-300') // Check char limit
                      }`}
                    />
                    <p className={`text-xs mt-1 ${
                      formState.about.bio && formState.about.bio.length > 1024 ? 'text-red-600' : 'text-gray-500' // Change color based on limit
                    }`}>
                      {formState.about.bio ? formState.about.bio.length : 0} / 1024 characters
                    </p>
                    {errors['about.bio'] && <p className="mt-1 text-sm text-red-600">{errors['about.bio']}</p>}
                  </div>
                </div>
              )}
            </div>
            {/* End of Optional Fields Accordion */}

          </div>
        )
      
      // Step 3 Rent
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Rent Preferences</h2>
            {/* Add fields for rent_preferences section: budgets, duration, room sharing, locations */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="min_budget" className="block text-sm font-medium text-gray-700">
                  Min Budget
                </label>
                <input
                  type="number"
                  id="min_budget"
                  value={formState.rent_preferences.min_budget ?? ''} // Use ?? '' to handle null
                  onChange={(e) => updateFormState('rent_preferences', 'min_budget', e.target.value ? Number(e.target.value) : null)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors['rent_preferences.min_budget'] ? 'border-red-500' : ''
                  }`}
                />
                {errors['rent_preferences.min_budget'] && <p className="mt-1 text-sm text-red-600">{errors['rent_preferences.min_budget']}</p>}
              </div>
              <div>
                <label htmlFor="max_budget" className="block text-sm font-medium text-gray-700">
                  Max Budget
                </label>
                <input
                  type="number"
                  id="max_budget"
                  value={formState.rent_preferences.max_budget ?? ''} // Use ?? '' to handle null
                  onChange={(e) => updateFormState('rent_preferences', 'max_budget', e.target.value ? Number(e.target.value) : null)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors['rent_preferences.max_budget'] ? 'border-red-500' : ''
                  }`}
                />
                {errors['rent_preferences.max_budget'] && <p className="mt-1 text-sm text-red-600">{errors['rent_preferences.max_budget']}</p>}
              </div>
            </div>
            {/* Add other 'rent_preferences' fields similarly */}
            {/* min_rent_duration_level (select) */}
            <div>
                <label htmlFor="min_rent_duration_level" className="block text-sm font-medium text-gray-700">
                  Min Rent Duration Level
                </label>
                <select
                  id="min_rent_duration_level"
                  value={formState.rent_preferences.min_rent_duration_level ?? ''} // Use ?? '' to handle null
                  onChange={(e) => updateFormState('rent_preferences', 'min_rent_duration_level', e.target.value ? Number(e.target.value) : null)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors['rent_preferences.min_rent_duration_level'] ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                </select>
                {errors['rent_preferences.min_rent_duration_level'] && <p className="mt-1 text-sm text-red-600">{errors['rent_preferences.min_rent_duration_level']}</p>}
            </div>

            {/* max_rent_duration_level (select) */}
            <div>
                <label htmlFor="max_rent_duration_level" className="block text-sm font-medium text-gray-700">
                  Max Rent Duration Level
                </label>
                <select
                  id="max_rent_duration_level"
                  value={formState.rent_preferences.max_rent_duration_level ?? ''} // Use ?? '' to handle null
                  onChange={(e) => updateFormState('rent_preferences', 'max_rent_duration_level', e.target.value ? Number(e.target.value) : null)}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors['rent_preferences.max_rent_duration_level'] ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                </select>
                {errors['rent_preferences.max_rent_duration_level'] && <p className="mt-1 text-sm text-red-600">{errors['rent_preferences.max_rent_duration_level']}</p>}
            </div>

            {/* room_sharing_level (select) - Add this block */}
            <div>
                <label htmlFor="room_sharing_level" className="block text-sm font-medium text-gray-700">
                  Room Sharing Level
                </label>
                <select
                  id="room_sharing_level"
                  value={formState.rent_preferences.room_sharing_level ?? ''} // Use ?? '' to handle null
                  onChange={(e) => updateFormState('rent_preferences', 'room_sharing_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 : null)} // Assuming 1 | 2 | 3 based on API spec for rent_preferences
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors['rent_preferences.room_sharing_level'] ? 'border-red-500' : ''
                  }`}
                >
                  <option value="">Select...</option>
                  <option value="1">Private Room Only</option>
                  <option value="2">Shared Room Possible</option>
                  <option value="3">Flexible (Any Arrangement)</option>
                </select>
                {errors['rent_preferences.room_sharing_level'] && <p className="mt-1 text-sm text-red-600">{errors['rent_preferences.room_sharing_level']}</p>}
            </div>
            {/* End of room_sharing_level field */}

            {/* Add Location Search Component */}
            <div>
                <label className="block text-sm font-medium text-gray-700">
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
    <div className="min-h-screen bg-gradient-to-br from-background-white to-primary-blue flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-md p-8 space-y-6">
        <h1 className="text-2xl font-bold text-center text-black">Set Up Your Profile</h1>

        {/* Progress Bar/Steps Indicator */}
        <div className="mb-6">
          <nav aria-label="Progress">
            <ol className="flex items-center space-x-4">
              {STEPS.map((step, index) => (
                <li key={step.name} className="relative md:flex-1 md:flex">
                  {index < currentStep ? (
                    <div className="group flex w-full">
                      <span className="flex items-center text-sm font-medium text-gray-900">
                        {step.name}
                      </span>
                    </div>
                  ) : index === currentStep ? (
                    <div className="flex items-center" aria-current="step">
                      <span className="flex items-center text-sm font-medium text-indigo-600">
                        {step.name}
                      </span>
                    </div>
                  ) : (
                    <div className="group flex w-full">
                      <span className="flex items-center text-sm font-medium text-gray-500">
                        {step.name}
                      </span>
                    </div>
                  )}
                  {index !== STEPS.length - 1 ? (
                    <div className="absolute top-0 right-0 h-0 w-5 hidden md:block">
                      <svg
                        className="h-full w-full text-gray-300"
                        viewBox="0 0 22 80"
                        fill="none"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M0 -2L20 40L0 82"
                          vectorEffect="non-scaling-stroke"
                          stroke="currentcolor"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* General Error Display (for validation or API errors) */}
        {generalError && ( // Or {apiError && ...} if you keep them separate
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">Error: {generalError}</span> {/* Or "API Error: {apiError}" */}
          </div>
        )}

        {/* API Error Display */}
        {apiError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">API Error: {apiError}</span>
          </div>
        )}

        {/* Step Content */}
        {getStepContent()}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className={`px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
              currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Back
          </button>
          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              className="ml-3 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className={`ml-3 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                isLoading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
            >
              {isLoading ? 'Creating Profile...' : 'Create Profile'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
