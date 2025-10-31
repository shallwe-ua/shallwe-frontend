'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/lib/shallwe/profile/api/calls' // Import update API call
import { ProfileUpdateFormState, getProfileUpdateFormStateInitial } from '@/lib/shallwe/profile/formstates/states' // Import NEW update form state and its initializer
import { collectProfileUpdateDataFromState } from '@/lib/shallwe/profile/formstates/collectors/update' // Import the NEW collector
import { validateProfileUpdateFields } from '@/lib/shallwe/profile/formstates/validators/update' // Import the NEW validator
import { ProfileUpdateData } from '@/lib/shallwe/profile/api/schema/update' // Import update schema
import { ProfileReadData } from '@/lib/shallwe/profile/api/schema/read' // Import read schema to get original data
import { ApiError } from '@/lib/shallwe/common/api/calls' // Import ApiError type
import ProfilePhotoPick from '@/app/components/profile/ProfilePhotoPick' // Assuming this is the correct path
import Locations from '@/app/components/profile/Locations' // Assuming this is the correct path
import { ValidationResult, validators } from '@/lib/shallwe/profile/formstates/validators/common'
import { TagsInput } from 'react-tag-input-component'
import BirthDateSelect from './BirthDateSelect'

// Define the props for the edit view
interface ProfileEditViewProps {
  initialProfileData: ProfileReadData // Pass the current profile data fetched on the server
  onSave: () => void // Callback to notify parent when save is successful
  onCancel: () => void // Callback to notify parent when edit is cancelled
}

export const ProfileEditView: React.FC<ProfileEditViewProps> = ({ initialProfileData, onSave, onCancel }) => {
  const router = useRouter()

  // Initialize editFormState using the NEW initializer function
  const initialEditFormState: ProfileUpdateFormState = getProfileUpdateFormStateInitial(initialProfileData)

  const [editFormState, setEditFormState] = useState<ProfileUpdateFormState>(initialEditFormState)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isFloatingApiErrorDismissed, setIsFloatingApiErrorDismissed] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Reset dismissal state if apiError changes (e.g., a new error occurs, or error is cleared)
  useEffect(() => {
    if (apiError) {
      setIsFloatingApiErrorDismissed(false); // Reset dismissal if a new error appears
    }
  }, [apiError]); // Run effect when apiError changes

  const initialLocationNamesMap = useMemo(() => {
    const map: Record<string, string> = {};
    const locationsData = initialProfileData.rent_preferences.locations; // This is LocationsReadFields

    // Populate map from regions
    locationsData.regions?.forEach(region => {
      map[region.hierarchy] = region.region_name;
    });

    // Populate map from cities
    locationsData.cities?.forEach(city => {
      // Format city name like in getDisplayName (e.g., "Kyiv (Kyivska)")
      map[city.hierarchy] = `${city.ppl_name} (${city.region_name})`;
      // Populate map from districts within cities
      city.districts?.forEach(district => {
        // Format district name like in getDisplayName (e.g., "Kyiv, Podilskyi")
        map[district.hierarchy] = `${city.ppl_name}, ${district.district_name}`;
      });
    });

    // Populate map from other_ppls
    locationsData.other_ppls?.forEach(otherPpl => {
      // Format other_ppl name like in getDisplayName
      const suffix = otherPpl.subregion_name ? `${otherPpl.region_name}, ${otherPpl.subregion_name}` : otherPpl.region_name;
      map[otherPpl.hierarchy] = `${otherPpl.ppl_name} (${suffix})`;
    });

    return map;
  }, [initialProfileData]); // Recalculate if initialProfileData changes


  const hasChanges = useMemo(() => {
    const updatePayload = collectProfileUpdateDataFromState(editFormState, initialProfileData);
    // Check if the collected payload has any properties (changes to send)
    return Object.keys(updatePayload).length > 0;
  }, [editFormState, initialProfileData]); // Re-run when form state or initial data changes


  const updateSmokingLevelAndClearTypes = (newLevel: ProfileUpdateFormState['about']['smoking_level']) => {
    setEditFormState(prev => {
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


  // Helper to safely update nested state - adapted for ProfileUpdateFormState
  const updateEditFormState = <S extends keyof ProfileUpdateFormState, F extends keyof ProfileUpdateFormState[S]>(
    section: S, field: F, value: ProfileUpdateFormState[S][F]
  ) => {
    setEditFormState(prev => ({
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

  // Handler for PhotoCropper to update the photo state
  const handlePhotoCropped = (croppedFile: File) => {
    updateEditFormState('profile', 'photo', croppedFile) // This now updates the File | null field
  }

  // Handler for PhotoCropper to set error
  const handlePhotoError = (error: string) => {
    setErrors(prevErrors => ({
        ...prevErrors,
        'profile.photo': error
    }))
  }

  // Handler for PhotoCropper to clear its error
  const clearPhotoError = () => {
    setErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        delete newErrors['profile.photo']
        return newErrors
    })
  }

  // Handler for LocationSearch to update locations state
  const handleLocationsChange = (newLocations: string[]) => {
    updateEditFormState('rent_preferences', 'locations', newLocations)
  }

  // Handler for LocationSearch to clear its error
  const clearLocationsError = () => {
    setErrors(prevErrors => {
        const newErrors = { ...prevErrors }
        delete newErrors['rent_preferences.locations']
        return newErrors
    })
  }

  // Validation function for the current state of editFormState - using NEW validator
  // It validates fields that are *present* in the editFormState (i.e., potentially changed fields)
  // The NEW validator likely needs the list of fields to validate.
  // You might need to define which fields are relevant for the current edit view,
  // or validate all possible fields if the validator handles non-present fields gracefully.
  // For now, let's assume it validates fields present in the state or a predefined list.
  // Define fields belonging to each section for validation (similar to ProfileSetupPage)
  const PROFILE_FIELDS_TO_VALIDATE = ['profile.name', 'profile.photo']
  const ABOUT_FIELDS_TO_VALIDATE = [
    'about.birth_date', 'about.gender', 'about.is_couple', 'about.has_children',
    'about.smoking_level', 'about.other_animals', 'about.interests', 'about.bio',
    'about.occupation_type', 'about.drinking_level', 'about.neighbourliness_level',
    'about.guests_level', 'about.parties_level', 'about.bedtime_level', 'about.neatness_level',
    'about.has_cats', 'about.has_dogs', 'about.has_reptiles', 'about.has_birds',
    'about.smokes_iqos', 'about.smokes_vape', 'about.smokes_tobacco', 'about.smokes_cigs',
  ]
  const RENT_PREFERENCES_FIELDS_TO_VALIDATE = [
    'rent_preferences.min_budget', 'rent_preferences.max_budget',
    'rent_preferences.min_rent_duration_level', 'rent_preferences.max_rent_duration_level',
    'rent_preferences.room_sharing_level', 'rent_preferences.locations',
  ]

  // Define a helper function to run validation and update errors
  const validateCurrentTagsInput = (fieldName: string, tagsToValidate: string[], validatorKey: string) => {
    const validationError = validators[validatorKey](tagsToValidate, editFormState);
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

  const validateEditForm = (): boolean => {
    // Combine all fields that could be validated during an update
    const allFieldsToValidate = [
      ...PROFILE_FIELDS_TO_VALIDATE,
      ...ABOUT_FIELDS_TO_VALIDATE,
      ...RENT_PREFERENCES_FIELDS_TO_VALIDATE,
    ]

    // Use the NEW update validator
    const validation: ValidationResult = validateProfileUpdateFields(editFormState, allFieldsToValidate)
    setErrors(validation.errors)
    return validation.isValid
  }

  // Save function
  const handleSave = async () => {
    if (!validateEditForm()) {
      console.log("Edit form validation failed.")
      return
    }

    setIsSaving(true)
    setApiError(null)

    try {
      // Use the NEW collector to determine the payload based on differences between editFormState and initialProfileData
      const profileDataToUpdate: ProfileUpdateData = collectProfileUpdateDataFromState(editFormState, initialProfileData)

      console.log("Collected Profile Data for Update API:", profileDataToUpdate)

      // Call the updateProfile API function with the structured data object
      await updateProfile(profileDataToUpdate)
      console.log("Profile updated successfully!")
      onSave() // Notify parent component of success
    } catch (error) {
      console.error("Error updating profile:", error)
      setIsSaving(false)
      let errorMessage = "Failed to update profile."
      if (error && typeof error === 'object' && 'details' in error) {
        const err = error as ApiError
        if (typeof err.details === 'string') {
            errorMessage = err.details
        } else if (typeof err.details === 'object' && err.details && 'error' in err.details) {
            // Attempt to parse field-specific errors from the API
            const apiErrors = err.details.error
            if (typeof apiErrors === 'object') {
                setErrors(apiErrors) // This might require flattening the nested error structure
                errorMessage = JSON.stringify(apiErrors)
            } else if (typeof apiErrors === 'string') {
                errorMessage = apiErrors
            }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      setApiError(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // --- RENDER LOGIC ---
  return (
    <div className="space-y-6">
      {/* API Error Display - Floating Notification (only if not dismissed) */}
      {apiError && !isFloatingApiErrorDismissed && (
        <div className="fixed inset-x-0 bottom-4 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg max-w-md w-full mx-4 pointer-events-auto relative">
            <span className="block sm:inline">API Error: {apiError}</span>
            <button
              type="button"
              onClick={() => setIsFloatingApiErrorDismissed(true)} // Dismiss the floating notification only
              className="absolute top-1 right-1 text-red-700 hover:text-red-900 focus:outline-none"
              aria-label="Dismiss floating error"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* API Error Display - Original Inline Version (only if floating was dismissed) */}
      {apiError && isFloatingApiErrorDismissed && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">API Error: {apiError}</span>
        </div>
      )}

      {/* Profile Data Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Photo and Basic Info */}
        <div className="md:col-span-1 flex flex-col items-center">
          {/* Photo Cropper Component */}
          {/* Pass the existing photo URL from initialProfileData for display */}
          {/* Pass the cropped file handler */}
          {/* Pass error and clear error handlers */}
          <ProfilePhotoPick
            initialFile={editFormState.profile.photo} // null if no new file, File if new file selected/cropped
            initialPhotoUrl={initialProfileData.profile.photo_w192 || null} // URL of existing photo
            onError={handlePhotoError}
            onClearError={clearPhotoError}
            onCropComplete={handlePhotoCropped}
          />
          {/* Display central validation error for photo if it exists */}
          {errors['profile.photo'] && <p className="mt-1 text-sm text-red-600">{errors['profile.photo']}</p>}

          <h2 className="text-xl font-semibold text-center mt-2">
            {/* Name Input */}
            <input
              type="text"
              value={editFormState.profile.name ?? ''} // Handle potential null
              onChange={(e) => updateEditFormState('profile', 'name', e.target.value)}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                errors['profile.name'] ? 'border-red-500' : ''
              }`}
            />
            {errors['profile.name'] && <p className="mt-1 text-sm text-red-600">{errors['profile.name']}</p>}
          </h2>
          {/* Profile visibility status is likely not editable here, just displayed */}
          <p className="text-gray-600 text-center">({initialProfileData.profile.is_hidden ? 'Hidden' : 'Visible'})</p>
        </div>

        {/* Main Details */}
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-2 gap-4">

            {/* Birth Date */}
            <BirthDateSelect
              inputId="birth_date"
              currentValue={editFormState.about.birth_date} // Pass the string value from state
              onChange={(dateString) => updateEditFormState('about', 'birth_date', dateString)} // Pass the update handler
              error={errors['about.birth_date']} // Pass the error message
              className={`${errors['about.birth_date'] ? 'border-red-500' : ''}`} // Pass specific Tailwind classes if needed
            />

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <div className="mt-1 space-y-2">
                {[
                  { id: 'gender_male_edit', value: 1, label: 'Male' },
                  { id: 'gender_female_edit', value: 2, label: 'Female' },
                ].map((option) => (
                  <div key={option.id} className="flex items-center">
                    <input
                      id={option.id}
                      name="gender_edit"
                      type="radio"
                      checked={editFormState.about.gender === option.value}
                      onChange={() => updateEditFormState('about', 'gender', option.value as 1 | 2)}
                      className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor={option.id} className="ml-3 block text-sm text-gray-700">
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              {errors['about.gender'] && <p className="mt-1 text-sm text-red-600">{errors['about.gender']}</p>}
            </div>
            {/* Is Couple */}
            <div className="flex flex-col mt-2">
              <div className="flex items-center">
                <input
                  id="is_couple_edit"
                  type="checkbox"
                  checked={editFormState.about.is_couple === true}
                  onChange={(e) => updateEditFormState('about', 'is_couple', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="is_couple_edit" className="ml-2 block text-sm text-gray-700">
                  Is Couple
                </label>
              </div>
              {errors['about.is_couple'] && <p className="mt-1 text-sm text-red-600">{errors['about.is_couple']}</p>}
            </div>
            {/* Has Children */}
            <div className="flex flex-col mt-2">
              <div className="flex items-center">
                <input
                  id="has_children_edit"
                  type="checkbox"
                  checked={editFormState.about.has_children === true}
                  onChange={(e) => updateEditFormState('about', 'has_children', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="has_children_edit" className="ml-2 block text-sm text-gray-700">
                  Has Children
                </label>
              </div>
              {errors['about.has_children'] && <p className="mt-1 text-sm text-red-600">{errors['about.has_children']}</p>}
            </div>
            {/* Add more fields as needed, mirroring the structure from ProfileSetupPage for the 'about' section */}
            {/* Example: Occupation Type */}
            <div>
              <label htmlFor="occupation_type_edit" className="block text-sm font-medium text-gray-700">
                Occupation Type
              </label>
              <select
                id="occupation_type_edit"
                value={editFormState.about.occupation_type ?? ''} // Handle potential null
                onChange={(e) => updateEditFormState('about', 'occupation_type', e.target.value ? Number(e.target.value) as 1 | 2 | 3 | 4 : null)} // Send null if empty string
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
            {/* Example: Drinking Level */}
            <div>
              <label htmlFor="drinking_level_edit" className="block text-sm font-medium text-gray-700">
                Drinking Level
              </label>
              <select
                id="drinking_level_edit"
                value={editFormState.about.drinking_level ?? ''} // Handle potential null
                onChange={(e) => updateEditFormState('about', 'drinking_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 | 4 : null)} // Send null if empty string
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

            <div>
              <label htmlFor="smoking_level_edit" className="block text-sm font-medium text-gray-700">
                Smoking Level
              </label>
              <select
                id="smoking_level_edit"
                value={editFormState.about.smoking_level ?? ''} // Handle potential null
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

            {/* Add Smoking Type Checkboxes (Conditional based on smoking_level) - ADD THIS BLOCK */}
            {editFormState.about.smoking_level !== null && editFormState.about.smoking_level > 1 && (
              <div className="col-span-2 mt-2"> {/* Use col-span-2 to span full width, add top margin */}
                <p className="text-sm font-medium text-gray-700 mb-1">Smoking Types:</p> {/* Label for the group */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 ml-2"> {/* Grid layout: 1 column on mobile, 2 on small screens, 4 on medium+ screens */}
                  <div className="flex items-center">
                    <input
                      id="smokes_iqos_edit"
                      type="checkbox"
                      checked={editFormState.about.smokes_iqos === true}
                      onChange={(e) => updateEditFormState('about', 'smokes_iqos', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="smokes_iqos_edit" className="ml-2 block text-sm text-gray-700">
                      IQOS
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="smokes_vape_edit"
                      type="checkbox"
                      checked={editFormState.about.smokes_vape === true}
                      onChange={(e) => updateEditFormState('about', 'smokes_vape', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="smokes_vape_edit" className="ml-2 block text-sm text-gray-700">
                      Vape
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="smokes_tobacco_edit"
                      type="checkbox"
                      checked={editFormState.about.smokes_tobacco === true}
                      onChange={(e) => updateEditFormState('about', 'smokes_tobacco', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="smokes_tobacco_edit" className="ml-2 block text-sm text-gray-700">
                      Tobacco
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="smokes_cigs_edit"
                      type="checkbox"
                      checked={editFormState.about.smokes_cigs === true}
                      onChange={(e) => updateEditFormState('about', 'smokes_cigs', e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="smokes_cigs_edit" className="ml-2 block text-sm text-gray-700">
                      Cigarettes
                    </label>
                  </div>
                </div>
              </div>
            )}
            {/* End of Smoking Type Checkboxes block */}
          </div>

          {/* Rent Preferences */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Rent Preferences</h3>
            <div className="grid grid-cols-2 gap-4">
              
              <div>
                <label htmlFor="min_budget_edit" className="block text-sm font-medium text-gray-700">
                  Min Budget
                </label>
                <input
                  type="number"
                  id="min_budget_edit"
                  value={editFormState.rent_preferences.min_budget}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const cleaned = raw.length > 1 ? raw.replace(/^0+(?=\d)/, '') : raw;
                    if (cleaned !== raw) e.target.value = cleaned
                    updateEditFormState('rent_preferences', 'min_budget', Number(cleaned));
                  }}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors['rent_preferences.min_budget'] ? 'border-red-500' : ''
                  }`}
                />
                {errors['rent_preferences.min_budget'] && <p className="mt-1 text-sm text-red-600">{errors['rent_preferences.min_budget']}</p>}
              </div>

              <div>
                <label htmlFor="max_budget_edit" className="block text-sm font-medium text-gray-700">
                  Max Budget
                </label>
                <input
                  type="number"
                  id="max_budget_edit"
                  value={editFormState.rent_preferences.max_budget}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const cleaned = raw.length > 1 ? raw.replace(/^0+(?=\d)/, '') : raw;
                    if (cleaned !== raw) e.target.value = cleaned
                    updateEditFormState('rent_preferences', 'max_budget', Number(cleaned));
                  }}
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors['rent_preferences.max_budget'] ? 'border-red-500' : ''
                  }`}
                />
                {errors['rent_preferences.max_budget'] && <p className="mt-1 text-sm text-red-600">{errors['rent_preferences.max_budget']}</p>}
              </div>

              <div>
                <label htmlFor="min_rent_duration_level_edit" className="block text-sm font-medium text-gray-700">
                  Min Rent Duration Level
                </label>
                <select
                  id="min_rent_duration_level_edit"
                  value={editFormState.rent_preferences.min_rent_duration_level} // Handle potential null
                  onChange={(e) => updateEditFormState('rent_preferences', 'min_rent_duration_level', Number(e.target.value))} // Send null if empty string
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors['rent_preferences.min_rent_duration_level'] ? 'border-red-500' : ''
                  }`}
                >
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                </select>
                {errors['rent_preferences.min_rent_duration_level'] && <p className="mt-1 text-sm text-red-600">{errors['rent_preferences.min_rent_duration_level']}</p>}
              </div>
              <div>
                <label htmlFor="max_rent_duration_level_edit" className="block text-sm font-medium text-gray-700">
                  Max Rent Duration Level
                </label>
                <select
                  id="max_rent_duration_level_edit"
                  value={editFormState.rent_preferences.max_rent_duration_level} // Handle potential null
                  onChange={(e) => updateEditFormState('rent_preferences', 'max_rent_duration_level', Number(e.target.value))} // Send null if empty string
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors['rent_preferences.max_rent_duration_level'] ? 'border-red-500' : ''
                  }`}
                >
                  <option value="1">Level 1</option>
                  <option value="2">Level 2</option>
                  <option value="3">Level 3</option>
                  <option value="4">Level 4</option>
                  <option value="5">Level 5</option>
                </select>
                {errors['rent_preferences.max_rent_duration_level'] && <p className="mt-1 text-sm text-red-600">{errors['rent_preferences.max_rent_duration_level']}</p>}
              </div>
              <div>
                <label htmlFor="room_sharing_level_edit" className="block text-sm font-medium text-gray-700">
                  Room Sharing Level
                </label>
                <select
                  id="room_sharing_level_edit"
                  value={editFormState.rent_preferences.room_sharing_level ?? ''} // Handle potential null
                  onChange={(e) => updateEditFormState('rent_preferences', 'room_sharing_level', Number(e.target.value) as 1 | 2 | 3)} // Send null if empty string
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                    errors['rent_preferences.room_sharing_level'] ? 'border-red-500' : ''
                  }`}
                >
                  <option value="1">Private Room Only</option>
                  <option value="2">Shared Room Possible</option>
                  <option value="3">Flexible (Any Arrangement)</option>
                </select>
                {errors['rent_preferences.room_sharing_level'] && <p className="mt-1 text-sm text-red-600">{errors['rent_preferences.room_sharing_level']}</p>}
              </div>
            </div>
            {/* Location Search Component */}
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Locations (Select up to 30, no overlaps)
                </label>
                <Locations
                    // Pass the array of hierarchies from editFormState
                    selectedLocations={editFormState.rent_preferences.locations}
                    initialLocationNames={initialLocationNamesMap} // PASS THE NEW PROP
                    onLocationsChange={handleLocationsChange}
                    // Pass error state and handler
                    // Ensure the error prop is either a string or undefined, never null
                    error={errors['rent_preferences.locations'] || undefined} // CORRECT: Use '|| undefined' to guarantee 'string | undefined' type
                    onClearError={clearLocationsError}
                />
                {errors['rent_preferences.locations'] && <p className="mt-1 text-sm text-red-600">{errors['rent_preferences.locations']}</p>}
            </div>
          </div>

          {/* Other Details - Similar structure, add fields as needed */}
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Other Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Example: Neighbourliness Level */}
                <div>
                  <label htmlFor="neighbourliness_level_edit" className="block text-sm font-medium text-gray-700">
                    Neighbourliness Level
                  </label>
                  <select
                    id="neighbourliness_level_edit"
                    value={editFormState.about.neighbourliness_level ?? ''} // Handle potential null
                    onChange={(e) => updateEditFormState('about', 'neighbourliness_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 : null)} // Send null if empty string
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
                
                <div>
                  <label htmlFor="guests_level_edit" className="block text-sm font-medium text-gray-700">
                    Guests Level
                  </label>
                  <select
                    id="guests_level_edit"
                    value={editFormState.about.guests_level ?? ''} // Handle potential null
                    onChange={(e) => updateEditFormState('about', 'guests_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 : null)} // Send null if empty string
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
                <div>
                  <label htmlFor="parties_level_edit" className="block text-sm font-medium text-gray-700">
                    Parties Level
                  </label>
                  <select
                    id="parties_level_edit"
                    value={editFormState.about.parties_level ?? ''} // Handle potential null
                    onChange={(e) => updateEditFormState('about', 'parties_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 : null)} // Send null if empty string
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
                <div>
                  <label htmlFor="bedtime_level_edit" className="block text-sm font-medium text-gray-700">
                    Bedtime Level
                  </label>
                  <select
                    id="bedtime_level_edit"
                    value={editFormState.about.bedtime_level ?? ''} // Handle potential null
                    onChange={(e) => updateEditFormState('about', 'bedtime_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 | 4 : null)} // Send null if empty string, adjust type if needed
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
                <div>
                  <label htmlFor="neatness_level_edit" className="block text-sm font-medium text-gray-700">
                    Neatness Level
                  </label>
                  <select
                    id="neatness_level_edit"
                    value={editFormState.about.neatness_level ?? ''} // Handle potential null
                    onChange={(e) => updateEditFormState('about', 'neatness_level', e.target.value ? Number(e.target.value) as 1 | 2 | 3 : null)} // Send null if empty string
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
                <div className="col-start-1 col-span-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">I Have Animals:</p> {/* Label for the group */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center">
                        <input
                          id="has_cats_edit"
                          type="checkbox"
                          checked={editFormState.about.has_cats === true}
                          onChange={(e) => updateEditFormState('about', 'has_cats', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="has_cats_edit" className="ml-2 block text-sm text-gray-700">
                          Cats
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="has_dogs_edit"
                          type="checkbox"
                          checked={editFormState.about.has_dogs === true}
                          onChange={(e) => updateEditFormState('about', 'has_dogs', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="has_dogs_edit" className="ml-2 block text-sm text-gray-700">
                          Dogs
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="has_reptiles_edit"
                          type="checkbox"
                          checked={editFormState.about.has_reptiles === true}
                          onChange={(e) => updateEditFormState('about', 'has_reptiles', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="has_reptiles_edit" className="ml-2 block text-sm text-gray-700">
                          Reptiles
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="has_birds_edit"
                          type="checkbox"
                          checked={editFormState.about.has_birds === true}
                          onChange={(e) => updateEditFormState('about', 'has_birds', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="has_birds_edit" className="ml-2 block text-sm text-gray-700">
                          Birds
                        </label>
                      </div>
                    </div>
                  </div>
                  {/* other_animals (TagsInput or similar) */}
                  <div className="col-span-2">
                    <label htmlFor="other_animals_edit" className="block text-sm font-medium text-gray-700">
                      Other Animals (up to 5)
                    </label>
                    <TagsInput
                      isEditOnRemove
                      value={editFormState.about.other_animals} // Bind to editFormState
                      beforeAddValidate={(newTag: string, currentTags: string[]) => {
                        const newTagsCandidate = [...currentTags, newTag];
                        const validationError = validators['about.other_animals'](newTagsCandidate, editFormState); // Use editFormState

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
                      onChange={(tags) => {
                          // Clear the specific error for this field whenever tags change
                          // This happens after a successful add (when beforeAddValidate passed)
                          // or a remove action.
                          setErrors(prevErrors => {
                            const newErrors = { ...prevErrors };
                            delete newErrors['about.other_animals']; // Remove the error for this key
                            return newErrors;
                          });
                          updateEditFormState('about', 'other_animals', tags); // Use updateEditFormState
                        }}
                      onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          const inputValue = (e.target as HTMLInputElement).value;

                          if (inputValue) {
                            const currentTags = editFormState.about.other_animals || []; // Use editFormState
                            const newTagsCandidate = [...currentTags, inputValue];
                            validateCurrentTagsInput('about.other_animals', newTagsCandidate, 'about.other_animals'); // Use helper
                          }
                          else {
                            const currentTags = editFormState.about.other_animals || [];
                            validateCurrentTagsInput('about.other_animals', currentTags, 'about.other_animals'); // Use helper
                          }
                        }}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                          const inputElement = e.target as HTMLInputElement
                          const inputValue = inputElement.value
                          if (inputValue) {
                            inputElement.value = '' // Clear the input field if it had an error and was blurred while containing text
                            setErrors(prevErrors => {
                              const newErrors = { ...prevErrors };
                              delete newErrors['about.other_animals']; // Remove the error for this key
                              return newErrors;
                            })
                          }
                        }}
                      name="other_animals_edit" // Unique name for this instance
                      placeHolder="Type and press enter"
                      // Adapted Tailwind classes for styling, matching the pattern from ProfileSetupPage and other inputs in ProfileEditView
                      classNames={{
                        tag: "bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm", // Style for individual tags
                        input: "mt-0 block w-full p-0 text-sm border-0 focus:outline-none focus:ring-0", // Style for the input field itself, removing default border/ring to inherit from parent
                        // The parent div provides the border, focus ring, and error styling
                      }}
                    />
                    {/* Error display using the standard pattern for this component */}
                    {errors['about.other_animals'] && <p className="mt-1 text-sm text-red-600">{errors['about.other_animals']}</p>}
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="interests_edit" className="block text-sm font-medium text-gray-700">
                      Interests (up to 5)
                    </label>
                    <TagsInput
                      isEditOnRemove
                      value={editFormState.about.interests || []} // Bind to editFormState
                      beforeAddValidate={(newTag: string, currentTags: string[]) => {
                          const newTagsCandidate = [...currentTags, newTag];
                          const validationError = validators['about.interests'](newTagsCandidate, editFormState); // Use editFormState

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
                          updateEditFormState('about', 'interests', tags); // Use updateEditFormState
                        }}
                      onKeyUp={(e: React.KeyboardEvent<HTMLInputElement>) => {
                          const inputValue = (e.target as HTMLInputElement).value;

                          if (inputValue) {
                            const currentTags = editFormState.about.interests || []; // Use editFormState
                            const newTagsCandidate = [...currentTags, inputValue];
                            validateCurrentTagsInput('about.interests', newTagsCandidate, 'about.interests'); // Use helper
                          }
                          else {
                            const currentTags = editFormState.about.interests || [];
                            validateCurrentTagsInput('about.interests', currentTags, 'about.interests'); // Use helper
                          }
                        }}
                      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                          const inputElement = e.target as HTMLInputElement
                          const inputValue = inputElement.value
                          if (inputValue) {
                            inputElement.value = '' // Clear the input field if it had an error and was blurred while containing text
                            setErrors(prevErrors => {
                              const newErrors = { ...prevErrors };
                              delete newErrors['about.interests']; // Remove the error for this key
                              return newErrors;
                            })
                          }
                        }}
                      name="interests_edit" // Unique name for this instance
                      placeHolder="Type and press enter"
                      // Adapted Tailwind classes for styling
                      classNames={{
                        tag: "bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm",
                        input: "mt-0 block w-full p-0 text-sm border-0 focus:outline-none focus:ring-0",
                      }}
                    />
                    {/* Error display */}
                    {errors['about.interests'] && <p className="mt-1 text-sm text-red-600">{errors['about.interests']}</p>}
                  </div>

                  {/* bio (textarea) */}
                  <div className="col-span-2">
                    <label htmlFor="bio_edit" className="block text-sm font-medium text-gray-700">
                      Bio (up to 1024 chars)
                    </label>
                    <textarea
                      id="bio_edit"
                      rows={3}
                      value={editFormState.about.bio ?? ''} // Handle potential null
                      onChange={(e) => updateEditFormState('about', 'bio', e.target.value || null)} // Send null if empty string
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
                        errors['about.bio'] ? 'border-red-500' : ''
                      }`}
                    />
                    <p className={`text-xs mt-1 ${
                      editFormState.about.bio && editFormState.about.bio.length > 1024 ? 'text-red-600' : 'text-gray-500' // Change color based on limit
                    }`}>
                      {editFormState.about.bio ? editFormState.about.bio.length : 0} / 1024 characters
                    </p>
                    {errors['about.bio'] && <p className="mt-1 text-sm text-red-600">{errors['about.bio']}</p>}
                  </div>
              </div>
            </div>
        </div>
      </div>

      {/* Save/Cancel Buttons */}
      <div className="flex justify-end space-x-4 mt-6">
        <button
          type="button"
          onClick={onCancel} // Call the cancel callback
          disabled={isSaving}
          className={`px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
            isSaving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!hasChanges || isSaving} // Disable if no changes OR if currently saving
          className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
            !hasChanges || isSaving // Condition for disabled state
              ? 'bg-gray-400 cursor-not-allowed' // Styles when disabled
              : 'bg-green-600 hover:bg-green-700' // Styles when enabled
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
        >
          {isSaving ? 'Saving...' : 'Save Changes'} {/* Button text can indicate saving */}
        </button>
      </div>
    </div>
  )
}
