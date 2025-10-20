'use client'


import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { TagsInput } from "react-tag-input-component"

import { createProfile } from '@/lib/shallwe/profile/api/calls'
import { ProfileCreateFormState, ProfileCreateFormStateInitial } from '@/lib/shallwe/profile/formstates/states' 
import { collectProfileCreateDataFromState } from '@/lib/shallwe/profile/formstates/collectors'
import { validateProfileCreateFields, ValidationResult } from '@/lib/shallwe/profile/formstates/validators'
import { ProfileCreateData } from '@/lib/shallwe/profile/api/schema/create'
import { ApiError } from '@/lib/shallwe/common/api/calls'

import ProfilePhoto from '../components/profile/ProfilePhoto'
import Locations from '../components/profile/Locations'


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
  const [formState, setFormState] = useState<ProfileCreateFormState>(ProfileCreateFormStateInitial)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const [isAboutAccordionOpen, setIsAboutAccordionOpen] = useState(false)
  const [locationsApiError, setLocationsApiError] = useState<string | null>(null)
  

  // Update the photo handler to interact with the PhotoCropper component
  const handlePhotoCropped = (croppedFile: File) => {
    updateFormState('profile', 'photo', croppedFile);
    // Clear the error state for profile.photo when the photo state is updated
    // This happens implicitly when validateCurrentStep/validateAllFields runs next,
    // but we can clear it explicitly here if desired, or let validation handle it.
    // The key is that if the state is valid, the error should disappear on next validation run.
  };

  // Callback for PhotoCropper to set error in the main page's state
  const handlePhotoError = (error: string) => {
    setErrors(prevErrors => ({
        ...prevErrors,
        'profile.photo': error // Set the specific field error
    }));
  };

  // Callback for PhotoCropper to clear error in the main page's state
  const clearPhotoError = () => {
    setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors['profile.photo']; // Remove the specific field error
        return newErrors;
    });
  };


  const clearLocationsApiError = () => {
     if (locationsApiError) {
         setLocationsApiError(null);
     }
  }


  const updateFormState = <S extends keyof ProfileCreateFormState, F extends keyof ProfileCreateFormState[S]>(
    section: S, field: F, value: ProfileCreateFormState[S][F]
  ) => {
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


  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null // File can be null
    updateFormState('profile', 'photo', file)
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


  const validateAllFields = (): boolean => {
    // Validate all fields for final submission
    const allFields = [...STEP_0_FIELDS_TO_VALIDATE, ...STEP_1_FIELDS_TO_VALIDATE, ...STEP_2_FIELDS_VALIDATE]
    const validation: ValidationResult = validateProfileCreateFields(formState, allFields)
    setErrors(validation.errors)
    return validation.isValid
  }


  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(prev => prev + 1)
      }
    }
  }


  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }


  const handleSubmit = async () => {
    if (!validateAllFields()) {
      console.log("Final validation failed, cannot submit.")
      return // Do not proceed if final validation fails
    }

    setIsLoading(true)
    setApiError(null)
    setErrors({}) // Clear previous API errors (and client-side validation errors)

    try {
      const profileDataToSend: ProfileCreateData = collectProfileCreateDataFromState(formState)
      console.log("Collected Profile Data for API:", profileDataToSend) // Debug log

      // Call the updated createProfile API function with the structured data object
      // The API call itself will handle converting this object into FormData using formatMultipartFormData
      await createProfile(profileDataToSend)
      console.log("Profile created successfully!")
      // On success, redirect to settings page
      router.push('/settings')
    }

    catch (error) {
      console.error("Error creating profile:", error)
      setIsLoading(false)
      if (error && typeof error === 'object' && 'details' in error) {
        const err = error as ApiError
        console.log("API Error Details:", err.details)
        // Example structure from API spec: {error: {profile: {name: ["error_msg"]}, non_field_errors: ["error_msg"]}}
        if (err.details && typeof err.details === 'object' && 'error' in err.details) {
          const apiErrors = err.details.error
          if (typeof apiErrors === 'object') {
            setApiError(JSON.stringify(apiErrors))
          }
          else if (typeof apiErrors === 'string') {
            setApiError(apiErrors) // If it's a simple string error
          }
        }
        else {
          setApiError(err.message || "An unknown error occurred during profile creation.")
        }
      } 
      else if (error instanceof Error) {
        setApiError(error.message)
      } 
      else {
        setApiError("An unexpected error occurred.")
      }
    }
    finally {
      setIsLoading(false)
    }
  }


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
              <ProfilePhoto
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

            {/* <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                Photo (JPG, PNG, HEIC, HEIF, max 20MB, square dimensions)
              </label>
              <input
                ref={photoInputRef} // Attach the ref
                type="file"
                id="photo"
                accept="image/jpeg,image/jpg,image/png,image/heic,image/heif"
                onChange={handlePhotoChange}
                className={`mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  ${errors['profile.photo'] ? 'border-red-500' : ''}`}
              />
              {errors['profile.photo'] && <p className="mt-1 text-sm text-red-600">{errors['profile.photo']}</p>}
              {formState.profile.photo && (
                  <div className="mt-2">
                      <p className="text-xs text-gray-500">Selected: {formState.profile.photo.name}</p>
                  </div>
              )}
            </div> */}
          </div>
        )
      
      // Step 2 About
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">About You</h2>

            {/* Required fields (birth_date, gender, is_couple, has_children) remain outside the accordion */}
            <div>
              <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700">
                Birth Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                id="birth_date"
                value={formState.about.birth_date ?? ''}
                onChange={(e) => updateFormState('about', 'birth_date', e.target.value || null)}
                className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                  errors['about.birth_date'] ? 'border-red-500' : ''
                }`}
              />
              {errors['about.birth_date'] && <p className="mt-1 text-sm text-red-600">{errors['about.birth_date']}</p>}
            </div>

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
                      onChange={(e) => updateFormState('about', 'smoking_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 | 4 : null)}
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
                    <div className="space-y-2 ml-4">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center">
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

                  {/* other_animals (text input - comma separated, validated by validator) */}
                  <div>
                    <label htmlFor="other_animals" className="block text-sm font-medium text-gray-700">
                      Other Animals (up to 5)
                    </label>
                    <TagsInput
                      value={formState.about.other_animals || []}
                      onChange={(tags) => updateFormState('about', 'other_animals', tags)}
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
                      value={formState.about.interests || []}
                      onChange={(tags) => updateFormState('about', 'interests', tags)}
                      name="interests"
                      placeHolder="Type and press enter"
                      classNames={{
                        tag: "bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm",
                        input: "mt-0 block w-full p-0 text-sm focus:outline-none",
                      }}
                    />
                    {errors['about.interests'] && <p className="mt-1 text-sm text-red-600">{errors['about.other_animals']}</p>}
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
                    {errors['about.bio'] && <p className="mt-1 text-sm text-red-600">{errors['about.bio']}</p>}
                    <p className={`text-xs mt-1 ${
                      formState.about.bio && formState.about.bio.length > 1024 ? 'text-red-600' : 'text-gray-500' // Change color based on limit
                    }`}>
                      {formState.about.bio ? formState.about.bio.length : 0} / 1024 characters
                    </p>
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
