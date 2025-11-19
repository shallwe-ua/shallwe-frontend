'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/lib/shallwe/profile/api/calls'
import { ProfileUpdateFormState, getProfileUpdateFormStateInitial } from '@/lib/shallwe/profile/formstates/states'
import { collectProfileUpdateDataFromState } from '@/lib/shallwe/profile/formstates/collectors/update'
import { validateProfileUpdateFields } from '@/lib/shallwe/profile/formstates/validators/update'
import { ProfileUpdateData } from '@/lib/shallwe/profile/api/schema/update'
import { ProfileReadData } from '@/lib/shallwe/profile/api/schema/read'
import { ApiError } from '@/lib/shallwe/common/api/calls'
import ProfilePhotoPick from '@/app/components/profile/ProfilePhotoPick'
import Locations from '@/app/components/profile/Locations'
import { ValidationResult, validators } from '@/lib/shallwe/profile/formstates/validators/common'
import { TagsInput } from 'react-tag-input-component'
import BirthDateSelect from './BirthDateSelect'
import { Section } from '@/components/ui/section'
import { Stack } from '@/components/ui/stack'
import { Card, CardContent } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FormField } from '@/components/ui/form-field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Radio } from '@/components/ui/radio'
import { Label } from '@/components/ui/label'

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
    <Section as="div" className="bg-background-soft/40" fullWidth>
      <Stack gap="lg" className="mx-auto w-full max-w-4xl">
        {apiError && !isFloatingApiErrorDismissed && (
          <Alert variant="destructive" className="flex items-center justify-between gap-4">
            <span>API Error: {apiError}</span>
            <Button variant="outline" size="sm" onClick={() => setIsFloatingApiErrorDismissed(true)}>
              Dismiss
            </Button>
          </Alert>
        )}

        <Stack gap="xs">
          <h2 className="text-xl font-semibold text-foreground">Edit your profile</h2>
          <p className="text-sm text-muted">Update your info and save the changes below.</p>
        </Stack>

        <Card>
          <CardContent className="p-6">
            <Stack gap="lg">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <Stack gap="sm" className="items-center">
                  <ProfilePhotoPick
                  initialFile={editFormState.profile.photo}
                  initialPhotoUrl={initialProfileData.profile.photo_w192 || null}
                  onError={handlePhotoError}
                  onClearError={clearPhotoError}
                  onCropComplete={handlePhotoCropped}
                />
                <FormField label="Display Name" error={errors['profile.name']} className="w-full text-left">
                  <Input
                    value={editFormState.profile.name ?? ''}
                    onChange={(e) => updateEditFormState('profile', 'name', e.target.value)}
                  />
                </FormField>
                {errors['profile.photo'] && (
                  <p className="text-sm text-destructive">{errors['profile.photo']}</p>
                )}
                <p className="text-sm text-muted text-center">
                  {initialProfileData.profile.is_hidden ? 'Currently hidden from matches' : 'Visible to matches'}
                </p>
              </Stack>

        {/* Main Details */}
        <div className="md:col-span-2">
          <Stack gap="lg">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <FormField label="Birth Date" error={errors['about.birth_date']}>
              <BirthDateSelect
                inputId="birth_date"
                currentValue={editFormState.about.birth_date}
                onChange={(dateString) => updateEditFormState('about', 'birth_date', dateString)}
              />
            </FormField>

            <FormField label="Gender" error={errors['about.gender']}>
              <div className="space-y-2">
                {[
                  { id: 'gender_male_edit', value: 1, label: 'Male' },
                  { id: 'gender_female_edit', value: 2, label: 'Female' },
                ].map((option) => (
                  <Label
                    key={option.id}
                    htmlFor={option.id}
                    className="flex items-center gap-2 text-sm text-muted"
                  >
                    <Radio
                      id={option.id}
                      name="gender_edit"
                      checked={editFormState.about.gender === option.value}
                      onChange={() => updateEditFormState('about', 'gender', option.value as 1 | 2)}
                    />
                    {option.label}
                  </Label>
                ))}
              </div>
            </FormField>
            <FormField label="Is Couple" error={errors['about.is_couple']}>
              <Label htmlFor="is_couple_edit" className="flex items-center gap-2 text-sm text-muted">
                <Checkbox
                  id="is_couple_edit"
                  checked={editFormState.about.is_couple === true}
                  onChange={(e) => updateEditFormState('about', 'is_couple', e.target.checked)}
                />
                Applying as a couple
              </Label>
            </FormField>

            <FormField label="Has Children" error={errors['about.has_children']}>
              <Label htmlFor="has_children_edit" className="flex items-center gap-2 text-sm text-muted">
                <Checkbox
                  id="has_children_edit"
                  checked={editFormState.about.has_children === true}
                  onChange={(e) => updateEditFormState('about', 'has_children', e.target.checked)}
                />
                Children will live with me
              </Label>
            </FormField>
            {/* Add more fields as needed, mirroring the structure from ProfileSetupPage for the 'about' section */}
            <FormField label="Occupation Type" error={errors['about.occupation_type']}>
              <Select
                id="occupation_type_edit"
                value={editFormState.about.occupation_type ?? ''}
                onChange={(e) =>
                  updateEditFormState(
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
                id="drinking_level_edit"
                value={editFormState.about.drinking_level ?? ''}
                onChange={(e) =>
                  updateEditFormState(
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

            <FormField label="Smoking Level" error={errors['about.smoking_level']}>
              <Select
                id="smoking_level_edit"
                value={editFormState.about.smoking_level ?? ''}
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

            {/* Add Smoking Type Checkboxes (Conditional based on smoking_level) - ADD THIS BLOCK */}
            {editFormState.about.smoking_level !== null && editFormState.about.smoking_level > 1 && (
              <FormField label="Smoking Types" hint="Select all that apply" className="col-span-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4">
                  {[
                    { id: 'smokes_iqos_edit', label: 'IQOS', field: 'smokes_iqos' as const },
                    { id: 'smokes_vape_edit', label: 'Vape', field: 'smokes_vape' as const },
                    { id: 'smokes_tobacco_edit', label: 'Tobacco', field: 'smokes_tobacco' as const },
                    { id: 'smokes_cigs_edit', label: 'Cigarettes', field: 'smokes_cigs' as const },
                  ].map((option) => (
                    <Label key={option.id} htmlFor={option.id} className="flex items-center gap-2 text-sm text-muted">
                      <Checkbox
                        id={option.id}
                        checked={editFormState.about[option.field] === true}
                        onChange={(e) => updateEditFormState('about', option.field, e.target.checked)}
                      />
                      {option.label}
                    </Label>
                  ))}
                </div>
              </FormField>
            )}
            {/* End of Smoking Type Checkboxes block */}
          </div>

          {/* Rent Preferences */}
          <div className="mt-4 space-y-4 rounded-lg bg-muted/10 p-4">
            <h3 className="text-lg font-medium text-foreground">Rent Preferences</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FormField label="Min Budget" error={errors['rent_preferences.min_budget']}>
                <Input
                  type="number"
                  inputMode="numeric"
                  id="min_budget_edit"
                  value={editFormState.rent_preferences.min_budget ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value
                    const cleaned = raw.length > 1 ? raw.replace(/^0+(?=\d)/, '') : raw
                    if (cleaned !== raw) e.target.value = cleaned
                    const nextValue = cleaned === '' ? null : Number(cleaned)
                    updateEditFormState(
                      'rent_preferences',
                      'min_budget',
                      nextValue as ProfileUpdateFormState['rent_preferences']['min_budget']
                    )
                  }}
                />
              </FormField>
              <FormField label="Max Budget" error={errors['rent_preferences.max_budget']}>
                <Input
                  type="number"
                  inputMode="numeric"
                  id="max_budget_edit"
                  value={editFormState.rent_preferences.max_budget ?? ''}
                  onChange={(e) => {
                    const raw = e.target.value
                    const cleaned = raw.length > 1 ? raw.replace(/^0+(?=\d)/, '') : raw
                    if (cleaned !== raw) e.target.value = cleaned
                    const nextValue = cleaned === '' ? null : Number(cleaned)
                    updateEditFormState(
                      'rent_preferences',
                      'max_budget',
                      nextValue as ProfileUpdateFormState['rent_preferences']['max_budget']
                    )
                  }}
                />
              </FormField>
              <FormField
                label="Min Rent Duration Level"
                error={errors['rent_preferences.min_rent_duration_level']}
              >
                <Select
                  id="min_rent_duration_level_edit"
                  value={editFormState.rent_preferences.min_rent_duration_level ?? ''}
                  onChange={(e) =>
                    updateEditFormState(
                      'rent_preferences',
                      'min_rent_duration_level',
                      e.target.value
                        ? (Number(e.target.value) as ProfileUpdateFormState['rent_preferences']['min_rent_duration_level'])
                        : (null as unknown as ProfileUpdateFormState['rent_preferences']['min_rent_duration_level'])
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
                  id="max_rent_duration_level_edit"
                  value={editFormState.rent_preferences.max_rent_duration_level ?? ''}
                  onChange={(e) =>
                    updateEditFormState(
                      'rent_preferences',
                      'max_rent_duration_level',
                      e.target.value
                        ? (Number(e.target.value) as ProfileUpdateFormState['rent_preferences']['max_rent_duration_level'])
                        : (null as unknown as ProfileUpdateFormState['rent_preferences']['max_rent_duration_level'])
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
                  id="room_sharing_level_edit"
                  value={editFormState.rent_preferences.room_sharing_level ?? ''}
                  onChange={(e) =>
                    updateEditFormState(
                      'rent_preferences',
                      'room_sharing_level',
                      e.target.value
                        ? (Number(e.target.value) as 1 | 2 | 3)
                        : (null as unknown as ProfileUpdateFormState['rent_preferences']['room_sharing_level'])
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
              hint="Select up to 30, no overlaps."
              error={errors['rent_preferences.locations']}
            >
              <Locations
                selectedLocations={editFormState.rent_preferences.locations}
                initialLocationNames={initialLocationNamesMap}
                onLocationsChange={handleLocationsChange}
                error={errors['rent_preferences.locations'] || undefined}
                onClearError={clearLocationsError}
              />
            </FormField>
          </div>

          {/* Other Details - Similar structure, add fields as needed */}
          <div className="mt-4 p-4 bg-muted/10 rounded-lg">
              <h3 className="text-lg font-medium text-foreground mb-2">Other Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Example: Neighbourliness Level */}
                <FormField label="Neighbourliness Level" error={errors['about.neighbourliness_level']}>
                  <Select
                    id="neighbourliness_level_edit"
                    value={editFormState.about.neighbourliness_level ?? ''}
                    onChange={(e) =>
                      updateEditFormState(
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
                    id="guests_level_edit"
                    value={editFormState.about.guests_level ?? ''}
                    onChange={(e) =>
                      updateEditFormState(
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
                    id="parties_level_edit"
                    value={editFormState.about.parties_level ?? ''}
                    onChange={(e) =>
                      updateEditFormState(
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
                <FormField label="Bedtime Level" error={errors['about.bedtime_level']}>
                  <Select
                    id="bedtime_level_edit"
                    value={editFormState.about.bedtime_level ?? ''}
                    onChange={(e) =>
                      updateEditFormState(
                        'about',
                        'bedtime_level',
                        e.target.value ? (Number(e.target.value) as 1 | 2 | 3 | 4) : null
                      )
                    }
                  >
                    <option value="">Select...</option>
                    <option value="1">Early (e.g., 22:00)</option>
                    <option value="2">Midnight</option>
                    <option value="3">Late (e.g., 02:00)</option>
                    <option value="4">Very Late (e.g., 04:00)</option>
                  </Select>
                </FormField>
                <FormField label="Neatness Level" error={errors['about.neatness_level']}>
                  <Select
                    id="neatness_level_edit"
                    value={editFormState.about.neatness_level ?? ''}
                    onChange={(e) =>
                      updateEditFormState(
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

                {/* Pet Checkboxes */}
                <div className="col-start-1 col-span-2">
                  <p className="text-sm font-medium text-muted mb-1">I Have Animals:</p> {/* Label for the group */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center">
                        <input
                          id="has_cats_edit"
                          type="checkbox"
                          checked={editFormState.about.has_cats === true}
                          onChange={(e) => updateEditFormState('about', 'has_cats', e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <label htmlFor="has_cats_edit" className="ml-2 block text-sm text-muted">
                          Cats
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="has_dogs_edit"
                          type="checkbox"
                          checked={editFormState.about.has_dogs === true}
                          onChange={(e) => updateEditFormState('about', 'has_dogs', e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <label htmlFor="has_dogs_edit" className="ml-2 block text-sm text-muted">
                          Dogs
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="has_reptiles_edit"
                          type="checkbox"
                          checked={editFormState.about.has_reptiles === true}
                          onChange={(e) => updateEditFormState('about', 'has_reptiles', e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <label htmlFor="has_reptiles_edit" className="ml-2 block text-sm text-muted">
                          Reptiles
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="has_birds_edit"
                          type="checkbox"
                          checked={editFormState.about.has_birds === true}
                          onChange={(e) => updateEditFormState('about', 'has_birds', e.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                        />
                        <label htmlFor="has_birds_edit" className="ml-2 block text-sm text-muted">
                          Birds
                        </label>
                      </div>
                    </div>
                  </div>
                  {/* other_animals (TagsInput or similar) */}
                  <div className="col-span-2">
                    <label htmlFor="other_animals_edit" className="block text-sm font-medium text-muted">
                      Other Animals (up to 5)
                    </label>
                    <TagsInput
                      isEditOnRemove
                      value={editFormState.about.other_animals || []} // Bind to editFormState
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
                      placeHolder="Press Enter to add"
                      // Adapted Tailwind classes for styling, matching the pattern from ProfileSetupPage and other inputs in ProfileEditView
                      classNames={{
                        tag: "bg-primary/10 text-primary px-2 py-1 rounded-md text-sm", // Style for individual tags
                        input: "mt-0 block w-full p-0 text-sm border-0 focus:outline-none focus:ring-0", // Style for the input field itself, removing default border/ring to inherit from parent
                        // The parent div provides the border, focus ring, and error styling
                      }}
                    />
                    {/* Error display using the standard pattern for this component */}
                    {errors['about.other_animals'] && <p className="mt-1 text-sm text-destructive">{errors['about.other_animals']}</p>}
                  </div>

                  <div className="col-span-2">
                    <label htmlFor="interests_edit" className="block text-sm font-medium text-muted">
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
                      placeHolder="Press Enter to add"
                      // Adapted Tailwind classes for styling
                      classNames={{
                        tag: "bg-primary/10 text-primary px-2 py-1 rounded-md text-sm",
                        input: "mt-0 block w-full p-0 text-sm border-0 focus:outline-none focus:ring-0",
                      }}
                    />
                    {/* Error display */}
                    {errors['about.interests'] && <p className="mt-1 text-sm text-destructive">{errors['about.interests']}</p>}
                  </div>

                  {/* bio (textarea) */}
                  <FormField label="Bio (up to 1024 chars)" error={errors['about.bio']} className="md:col-span-2">
                    <Textarea
                      id="bio_edit"
                      rows={3}
                      value={editFormState.about.bio ?? ''}
                      onChange={(e) => updateEditFormState('about', 'bio', e.target.value || null)}
                      className={editFormState.about.bio && editFormState.about.bio.length > 1024 ? 'ring-2 ring-destructive/70' : undefined}
                    />
                    <p
                      className={`text-xs mt-1 ${
                        editFormState.about.bio && editFormState.about.bio.length > 1024 ? 'text-destructive' : 'text-muted'
                      }`}
                    >
                      {editFormState.about.bio ? editFormState.about.bio.length : 0} / 1024 characters
                    </p>
                  </FormField>
              </div>
            </div>
          </Stack>
        </div>
      </div>

      {/* Save/Cancel Buttons */}
      <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Section>
  )
}
