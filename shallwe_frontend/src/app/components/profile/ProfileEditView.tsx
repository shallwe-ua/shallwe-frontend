'use client'

import { useState, useMemo, useEffect } from 'react'
import { updateProfile } from '@/lib/shallwe/profile/api/calls'
import { ProfileUpdateFormState, getProfileUpdateFormStateInitial } from '@/lib/shallwe/profile/formstates/states'
import { collectProfileUpdateDataFromState } from '@/lib/shallwe/profile/formstates/collectors/update'
import { validateProfileUpdateFields } from '@/lib/shallwe/profile/formstates/validators/update'
import { ProfileUpdateData } from '@/lib/shallwe/profile/api/schema/update'
import { ProfileReadData } from '@/lib/shallwe/profile/api/schema/read'
import { ApiError } from '@/lib/shallwe/common/api/calls'
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
} from '@/app/components/fields'
import {
  ABOUT_FIELDS_TO_VALIDATE,
  PROFILE_FIELDS_TO_VALIDATE,
  RENT_PREFERENCES_FIELDS_TO_VALIDATE,
} from '@/app/components/fields/validationFieldLists'
import { applySmokingLevelReset, ensureSmokingLevelBeforeTypes } from '@/app/components/fields/smokingHelpers'
import { ValidationResult, validators } from '@/lib/shallwe/profile/formstates/validators/common'
import { Stack } from '@/app/components/ui/primitives/stack'
import { Card, CardContent } from '@/app/components/ui/primitives/card'
import { Alert } from '@/app/components/ui/primitives/alert'
import { Button } from '@/app/components/ui/primitives/button'

// Define the props for the edit view
interface ProfileEditViewProps {
  initialProfileData: ProfileReadData // Pass the current profile data fetched on the server
  onSave: () => void // Callback to notify parent when save is successful
  onCancel: () => void // Callback to notify parent when edit is cancelled
}

export const ProfileEditView: React.FC<ProfileEditViewProps> = ({ initialProfileData, onSave, onCancel }) => {

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
      // Format city name like in getDisplayName (e.g., 'Kyiv (Kyivska)')
      map[city.hierarchy] = `${city.ppl_name} (${city.region_name})`;
      // Populate map from districts within cities
      city.districts?.forEach(district => {
        // Format district name like in getDisplayName (e.g., 'Kyiv, Podilskyi')
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
    setEditFormState(prev => ({
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
  const validateEditForm = (): boolean => {
    // Combine all fields that could be validated during an update
    const allFieldsToValidate = [
      ...PROFILE_FIELDS_TO_VALIDATE,
      ...ABOUT_FIELDS_TO_VALIDATE,
      ...RENT_PREFERENCES_FIELDS_TO_VALIDATE,
    ]

    // Use the NEW update validator
    const errorsMap: Record<string, string> = {}
    const validation: ValidationResult = validateProfileUpdateFields(editFormState, allFieldsToValidate)
    Object.assign(errorsMap, validation.errors)

    const smokingOk = ensureSmokingLevelBeforeTypes(editFormState.about, errorsMap)

    setErrors(errorsMap)
    return validation.isValid && smokingOk
  }

  // Save function
  const handleSave = async () => {
    if (!validateEditForm()) {
      console.log('Edit form validation failed.')
      return
    }

    setIsSaving(true)
    setApiError(null)

    try {
      // Use the NEW collector to determine the payload based on differences between editFormState and initialProfileData
      const profileDataToUpdate: ProfileUpdateData = collectProfileUpdateDataFromState(editFormState, initialProfileData)

      console.log('Collected Profile Data for Update API:', profileDataToUpdate)

      // Call the updateProfile API function with the structured data object
      await updateProfile(profileDataToUpdate)
      console.log('Profile updated successfully!')
      onSave() // Notify parent component of success
    } catch (error) {
      console.error('Error updating profile:', error)
      setIsSaving(false)
      let errorMessage = 'Failed to update profile.'
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

  const handleEditCancel = () => {
    onCancel()
  }

  // --- RENDER LOGIC ---
  return (
    
    <div className='bg-surface-muted'>
      <Stack gap='md' className='mx-auto w-full max-w-5xl'>
        {apiError && !isFloatingApiErrorDismissed && (
          <Alert variant='destructive' className='flex items-center justify-between gap-4'>
            <span>API Error: {apiError}</span>
            <Button variant='outline' size='sm' onClick={() => setIsFloatingApiErrorDismissed(true)}>
              Dismiss
            </Button>
          </Alert>
        )}

        <Card className='rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]'>
          <CardContent className='p-5 sm:p-6'>
            <Stack gap='md'>
              <div className='grid grid-cols-1 gap-5 md:grid-cols-3'>
                <Stack gap='sm' className='items-center'>
                  <ProfilePhotoField
                    value={editFormState.profile.photo}
                    initialPhotoUrl={initialProfileData.profile.photo_w192 || null}
                    error={errors['profile.photo']}
                    onChange={handlePhotoCropped}
                    onError={handlePhotoError}
                    onClearError={clearPhotoError}
                  />
                  <DisplayNameField
                    value={editFormState.profile.name}
                    error={errors['profile.name']}
                    onChange={(val) => updateEditFormState('profile', 'name', val)}
                    onErrorClear={() => {
                      if (errors['profile.name']) setErrors((prev) => { const n = { ...prev }; delete n['profile.name']; return n })
                    }}
                  />
                </Stack>

                <Stack gap='md' className='md:col-span-2'>
                  <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                    <BirthDateField
                      value={editFormState.about.birth_date}
                      error={errors['about.birth_date']}
                      onChange={(val) => updateEditFormState('about', 'birth_date', val)}
                      onErrorClear={() => {
                        if (errors['about.birth_date']) setErrors((prev) => { const n = { ...prev }; delete n['about.birth_date']; return n })
                      }}
                    />

                    <GenderField
                      value={editFormState.about.gender as 1 | 2 | null}
                      error={errors['about.gender']}
                      onChange={(val) => updateEditFormState('about', 'gender', val)}
                      onErrorClear={() => {
                        if (errors['about.gender']) setErrors((prev) => { const n = { ...prev }; delete n['about.gender']; return n })
                      }}
                    />

                    <CoupleField
                      value={editFormState.about.is_couple === true}
                      error={errors['about.is_couple']}
                      onChange={(val) => updateEditFormState('about', 'is_couple', val)}
                      onErrorClear={() => {
                        if (errors['about.is_couple']) setErrors((prev) => { const n = { ...prev }; delete n['about.is_couple']; return n })
                      }}
                    />

                    <ChildrenField
                      value={editFormState.about.has_children === true}
                      error={errors['about.has_children']}
                      onChange={(val) => updateEditFormState('about', 'has_children', val)}
                      onErrorClear={() => {
                        if (errors['about.has_children']) setErrors((prev) => { const n = { ...prev }; delete n['about.has_children']; return n })
                      }}
                    />

                    <OccupationField
                      value={editFormState.about.occupation_type}
                      error={errors['about.occupation_type']}
                      onChange={(val) => updateEditFormState('about', 'occupation_type', val)}
                      onErrorClear={() => {
                        if (errors['about.occupation_type']) setErrors((prev) => { const n = { ...prev }; delete n['about.occupation_type']; return n })
                      }}
                    />

                    <DrinkingLevelField
                      value={editFormState.about.drinking_level}
                      error={errors['about.drinking_level']}
                      onChange={(val) => updateEditFormState('about', 'drinking_level', val)}
                      onErrorClear={() => {
                        if (errors['about.drinking_level']) setErrors((prev) => { const n = { ...prev }; delete n['about.drinking_level']; return n })
                      }}
                    />

                    <SmokingLevelField
                      value={editFormState.about.smoking_level}
                      error={errors['about.smoking_level']}
                      onChange={(val) => updateSmokingLevelAndClearTypes(val)}
                      onErrorClear={() => {
                        if (errors['about.smoking_level']) setErrors((prev) => { const n = { ...prev }; delete n['about.smoking_level']; return n })
                      }}
                    />

                    <SmokingTypesField
                      value={{
                        smokes_iqos: editFormState.about.smokes_iqos,
                        smokes_vape: editFormState.about.smokes_vape,
                        smokes_tobacco: editFormState.about.smokes_tobacco,
                        smokes_cigs: editFormState.about.smokes_cigs,
                      }}
                      smokingLevel={editFormState.about.smoking_level}
                      error={errors['about.smoking_level']}
                      onChange={(field, checked) => updateEditFormState('about', field, checked)}
                      onErrorClear={() => {
                        if (errors['about.smoking_level']) setErrors((prev) => { const n = { ...prev }; delete n['about.smoking_level']; return n })
                      }}
                    />

                    <NeighbourlinessLevelField
                      value={editFormState.about.neighbourliness_level}
                      error={errors['about.neighbourliness_level']}
                      onChange={(val) => updateEditFormState('about', 'neighbourliness_level', val)}
                      onErrorClear={() => {
                        if (errors['about.neighbourliness_level']) setErrors((prev) => { const n = { ...prev }; delete n['about.neighbourliness_level']; return n })
                      }}
                    />

                    <GuestsLevelField
                      value={editFormState.about.guests_level}
                      error={errors['about.guests_level']}
                      onChange={(val) => updateEditFormState('about', 'guests_level', val)}
                      onErrorClear={() => {
                        if (errors['about.guests_level']) setErrors((prev) => { const n = { ...prev }; delete n['about.guests_level']; return n })
                      }}
                    />

                    <PartiesLevelField
                      value={editFormState.about.parties_level}
                      error={errors['about.parties_level']}
                      onChange={(val) => updateEditFormState('about', 'parties_level', val)}
                      onErrorClear={() => {
                        if (errors['about.parties_level']) setErrors((prev) => { const n = { ...prev }; delete n['about.parties_level']; return n })
                      }}
                    />

                    <BedtimeLevelField
                      value={editFormState.about.bedtime_level}
                      error={errors['about.bedtime_level']}
                      onChange={(val) => updateEditFormState('about', 'bedtime_level', val)}
                      onErrorClear={() => {
                        if (errors['about.bedtime_level']) setErrors((prev) => { const n = { ...prev }; delete n['about.bedtime_level']; return n })
                      }}
                    />

                    <NeatnessLevelField
                      value={editFormState.about.neatness_level}
                      error={errors['about.neatness_level']}
                      onChange={(val) => updateEditFormState('about', 'neatness_level', val)}
                      onErrorClear={() => {
                        if (errors['about.neatness_level']) setErrors((prev) => { const n = { ...prev }; delete n['about.neatness_level']; return n })
                      }}
                    />

                    <AnimalsOwnedField
                      value={{
                        has_cats: editFormState.about.has_cats,
                        has_dogs: editFormState.about.has_dogs,
                        has_reptiles: editFormState.about.has_reptiles,
                        has_birds: editFormState.about.has_birds,
                      }}
                      onChange={(field, checked) => updateEditFormState('about', field, checked)}
                    />

                    <OtherAnimalsTagsField
                      value={editFormState.about.other_animals || []}
                      error={errors['about.other_animals']}
                      onChange={(tags) => updateEditFormState('about', 'other_animals', tags)}
                      validator={(tags) => validators['about.other_animals'](tags, editFormState)}
                      onErrorClear={() => {
                        if (errors['about.other_animals']) setErrors((prev) => { const n = { ...prev }; delete n['about.other_animals']; return n })
                      }}
                    />

                    <InterestsTagsField
                      value={editFormState.about.interests || []}
                      error={errors['about.interests']}
                      onChange={(tags) => updateEditFormState('about', 'interests', tags)}
                      validator={(tags) => validators['about.interests'](tags, editFormState)}
                      onErrorClear={() => {
                        if (errors['about.interests']) setErrors((prev) => { const n = { ...prev }; delete n['about.interests']; return n })
                      }}
                    />

                    <BioField
                      value={editFormState.about.bio}
                      error={errors['about.bio']}
                      onChange={(val) => updateEditFormState('about', 'bio', val)}
                      onErrorClear={() => {
                        if (errors['about.bio']) setErrors((prev) => { const n = { ...prev }; delete n['about.bio']; return n })
                      }}
                    />
                  </div>

                  <div className='space-y-3'>
                    <h3 className='text-base font-semibold text-foreground'>Rent Preferences</h3>
                    <div className='grid gap-4 md:grid-cols-2'>
                      <BudgetRangeField
                        min={editFormState.rent_preferences.min_budget}
                        max={editFormState.rent_preferences.max_budget}
                        minError={errors['rent_preferences.min_budget']}
                        maxError={errors['rent_preferences.max_budget']}
                        onChange={(which, val) =>
                          updateEditFormState('rent_preferences', which === 'min' ? 'min_budget' : 'max_budget', val)
                        }
                      />

                      <RentDurationRangeField
                        min={editFormState.rent_preferences.min_rent_duration_level}
                        max={editFormState.rent_preferences.max_rent_duration_level}
                        minError={errors['rent_preferences.min_rent_duration_level']}
                        maxError={errors['rent_preferences.max_rent_duration_level']}
                        onChange={(which, val) =>
                          updateEditFormState('rent_preferences', which === 'min' ? 'min_rent_duration_level' : 'max_rent_duration_level', val)
                        }
                      />

                      <RoomSharingLevelField
                        value={editFormState.rent_preferences.room_sharing_level}
                        error={errors['rent_preferences.room_sharing_level']}
                        onChange={(val) => updateEditFormState('rent_preferences', 'room_sharing_level', val)}
                        onErrorClear={() => {
                          if (errors['rent_preferences.room_sharing_level'])
                            setErrors((prev) => { const n = { ...prev }; delete n['rent_preferences.room_sharing_level']; return n })
                        }}
                      />
                    </div>

                    <LocationsField
                      value={editFormState.rent_preferences.locations}
                      error={errors['rent_preferences.locations']}
                      onChange={handleLocationsChange}
                      onClearError={clearLocationsError}
                      initialLocationNames={initialLocationNamesMap}
                    />
                  </div>
                </Stack>
              </div>

              <Stack className='items-center justify-end gap-3 sm:flex-row'>
                <div className='flex w-full flex-col gap-2 text-sm text-muted-foreground sm:w-auto sm:flex-1'>
                  {!hasChanges && <span>No changes yet.</span>}
                  {hasChanges && <span>Unsaved changes.</span>}
                </div>
                <div className='flex w-full flex-col gap-3 sm:w-auto sm:flex-row'>
                  <Button variant='outline' onClick={handleEditCancel} disabled={isSaving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
                    {isSaving ? 'Saving…' : 'Save changes'}
                  </Button>
                </div>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </div>
  )
}
