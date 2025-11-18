'use client'


import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { getProfile, updateProfileVisibility } from '@/lib/shallwe/profile/api/calls' // Import read and visibility API calls
import { deleteUser } from '@/lib/shallwe/auth/api/calls' // Import delete API call
import { ProfileReadData } from '@/lib/shallwe/profile/api/schema/read' // Import the read data type
import { ApiError } from '@/lib/shallwe/common/api/calls' // Import ApiError type
import { ProfileEditView } from '../components/profile/ProfileEditView'
import PhotoWithFallbacks from '../components/profile/PhotoWithFallbacks'
import { LocationsReadFields } from '@/lib/shallwe/locations/api/schema'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert } from '@/components/ui/alert'


interface DisplayLocation {
  type: 'region' | 'city' | 'district' | 'other_ppl';
  displayName: string;
}


export const prepareLocationsForDisplay = (locationsObject: LocationsReadFields): DisplayLocation[] => {
  const displayItems: DisplayLocation[] = [];

  // Process Regions
  if (locationsObject.regions) {
    locationsObject.regions.forEach(region => {
      displayItems.push({
        type: 'region',
        displayName: region.region_name,
      });
    });
  }

  // Process Cities and their Districts (applying the rule)
  if (locationsObject.cities) {
    locationsObject.cities.forEach(city => {
      const districtHierarchies = city.districts || [];
      if (districtHierarchies.length > 0) {
        // Rule: If city has districts, add only the districts
        districtHierarchies.forEach(district => {
          displayItems.push({
            type: 'district',
            displayName: `${city.ppl_name}, ${district.district_name}`, // e.g., "Kyiv, Holosiivskyi"
          });
        });
      } else {
        // Rule: If city has no districts, add the city
        displayItems.push({
          type: 'city',
          displayName: `${city.ppl_name} (${city.region_name})`, // e.g., "Lviv (Lvivska)"
        });
      }
    });
  }

  // Process Other PPLs
  if (locationsObject.other_ppls) {
    locationsObject.other_ppls.forEach(otherPpl => {
      const suffix = otherPpl.subregion_name
        ? `${otherPpl.region_name}, ${otherPpl.subregion_name}`
        : otherPpl.region_name;
      displayItems.push({
        type: 'other_ppl',
        displayName: `${otherPpl.ppl_name} (${suffix})`, // e.g., "Yasno (Ivano-Frankivska, Nizhynskyi)"
      });
    });
  }

  return displayItems;
};


export default function SettingsPage() {

  const [profileData, setProfileData] = useState<ProfileReadData | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Add loading state
  const [isVisibilityUpdating, setIsVisibilityUpdating] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  const formatSmokingTypes = (smokesIqos: boolean | null, smokesVape: boolean | null, smokesTobacco: boolean | null, smokesCigs: boolean | null): string => {
    const types: string[] = [];
    if (smokesIqos) types.push('IQOS');
    if (smokesVape) types.push('Vape');
    if (smokesTobacco) types.push('Tobacco');
    if (smokesCigs) types.push('Cigarettes');
    return types.join(', ');
  }

  const handleEditClick = () => {
    setIsEditing(true)
    setApiError(null) // Clear any previous errors when starting edit
  }

  const handleEditSave = () => {
    setIsEditing(false) // Set isEditing back to false on successful save
    fetchProfile()
  }

  const handleEditCancel = () => {
    setIsEditing(false) // Set isEditing back to false on cancel
    setApiError(null) // Clear any errors set during editing
  }

  const fetchProfile = async () => {
    try {
      setIsLoading(true) // Set loading state
      setApiError(null) // Clear previous errors
      const data = await getProfile()
      setProfileData(data)
      console.log("Profile data fetched successfully:", data)
    } catch (error) {
      console.error("Error fetching profile in SettingsPage client component:", error)
      // Handle potential 404 (profile not found) or 403 (unauthorized) from getProfile
      // If API returns 403/404, redirect to setup or landing.
      // Let's assume getProfile throws an error object compatible with ApiError.
      if (error && typeof error === 'object' && 'details' in error) {
        const err = error as ApiError
        // Check if it's a 403 or 404 error from the API call
        // This requires checking the response status within the error object,
        // which baseApiCall should provide.
        // Example: if (err.details.status === 404 || err.details.status === 403) { ... }
        // For now, just set the error message.
        let errorMessage = "Failed to load profile."
        if (typeof err.details === 'string') {
            errorMessage = err.details
        } else if (typeof err.details === 'object' && err.details && 'error' in err.details) {
            errorMessage = JSON.stringify(err.details.error)
        } else if (err.details && 'status' in err.details) {
            // Assuming err.details contains the response object or status
            if (err.details.status === 404 || err.details.status === 403) {
                // Redirect to setup or landing if profile not found/unauthorized
                // This mimics the server-side redirect logic
                console.log("Profile not found or unauthorized, redirecting...")
                router.push('/') // Redirect to landing as a safe fallback
                return // Exit useEffect after redirect
            }
        }
        setApiError(errorMessage)
      } else if (error instanceof Error) {
        setApiError(error.message)
      } else {
        setApiError("An unexpected error occurred while loading your profile.")
      }
    } finally {
      setIsLoading(false) // Clear loading state
    }
  }

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile()
  }, [router]) // Add router to dependency array if used for redirect

  const handleToggleVisibility = async () => {
    if (isVisibilityUpdating || !profileData) return // Prevent calls if updating or data not loaded

    setIsVisibilityUpdating(true)
    setApiError(null)
    const newIsHidden = !profileData.profile.is_hidden

    try {
      await updateProfileVisibility(newIsHidden)
      // Update local state optimistically
      setProfileData(prev => prev ? {
        ...prev,
        profile: { ...prev.profile, is_hidden: newIsHidden }
      } : null)
      console.log(`Profile visibility updated to: ${newIsHidden ? 'Hidden' : 'Visible'}`)
    } catch (error) {
      console.error("Error updating profile visibility:", error)
      let errorMessage = "Failed to update profile visibility."
      if (error && typeof error === 'object' && 'details' in error) {
        const err = error as ApiError
        if (typeof err.details === 'string') {
            errorMessage = err.details
        } else if (typeof err.details === 'object' && err.details && 'error' in err.details) {
            errorMessage = JSON.stringify(err.details.error)
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      setApiError(errorMessage)
    } finally {
      setIsVisibilityUpdating(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (isDeleting) return

    setIsDeleting(true)
    setApiError(null)

    try {
      await deleteUser()
      console.log("Profile and user deleted successfully!")
      // Redirect to landing page after successful deletion
      router.push('/')
      // router.refresh() // Optional: Refresh might not be needed after push
    } catch (error) {
      console.error("Error deleting user:", error)
      setIsDeleting(false)
      let errorMessage = "Failed to delete user."
      if (error && typeof error === 'object' && 'details' in error) {
        const err = error as ApiError
        if (typeof err.details === 'string') {
            errorMessage = err.details
        } else if (typeof err.details === 'object' && err.details && 'error' in err.details) {
            errorMessage = JSON.stringify(err.details.error)
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      setApiError(errorMessage)
    }
  }

  // --- HELPER FUNCTIONS (Copied from ProfileReadView) ---
  const formatBoolean = (value: boolean): string => (value ? 'Yes' : 'No')

  const formatLevel = (value: number | null, type: 'drinking' | 'smoking' | 'neighbourliness' | 'guests' | 'parties' | 'bedtime' | 'neatness' | 'duration' | 'room_sharing'): string => {
    if (value === null) return 'Not specified'
    const labels: Record<string, string[]> = {
      drinking: ['Never', 'Rarely', 'Socially', 'Often'],
      smoking: ['Never', 'Rarely', 'Socially', 'Often'],
      neighbourliness: ['Low', 'Medium', 'High'],
      guests: ['Low', 'Medium', 'High'],
      parties: ['Low', 'Medium', 'High'],
      bedtime: ['Early (e.g., 22:00)', 'Midnight', 'Late (e.g., 02:00)', 'Very Late (e.g., 04:00)'],
      neatness: ['Low', 'Medium', 'High'],
      duration: ['1 month', '2 months', '3 months', '6 months', '1 year'],
      room_sharing: ['Private Room Only', 'Shared Room Possible', 'Flexible (Any Arrangement)'],
    }
    const typeLabels = labels[type]
    if (typeLabels && value >= 1 && value <= typeLabels.length) {
      return typeLabels[value - 1]
    }
    return `Level ${value}`
  }

  const formatOccupation = (value: number | null): string => {
    if (value === null) return 'Not specified'
    const labels: Record<number, string> = { 1: 'Employed', 2: 'Student', 3: 'Unemployed', 4: 'Retired' }
    return labels[value] || `Type ${value}`
  }

  const formatGender = (value: number | null): string => {
    if (value === null) return 'Not specified'
    const labels: Record<number, string> = { 1: 'Male', 2: 'Female' }
    return labels[value] || `Gender ${value}`
  }

  const joinArray = (items: string[] | undefined): string => {
    return items ? items.join(', ') : 'None'
  }
  // --- END HELPER FUNCTIONS ---

  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center text-muted">Loading your profile…</CardContent>
        </Card>
      </div>
    )
  }

  if (!profileData) {
    // This state should ideally be handled by the error check in useEffect leading to a redirect,
    // but render a message just in case.
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8">
        <Card className="w-full max-w-md space-y-4">
          <CardHeader>
            <CardTitle className="text-center">Profile not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted">We could not load your profile data.</p>
            {apiError && <Alert variant="destructive">{apiError}</Alert>}
            <Button onClick={() => router.push('/')} className="w-full">
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // --- MAIN RENDER (Profile Data Loaded) ---
  return (
    <div className="min-h-screen py-10">
      <div className="page-shell max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-foreground">Your Profile Settings</h1>
          {!isEditing && (
            <Button onClick={handleEditClick} size="sm">
              Edit
            </Button>
          )}
        </div>

        {apiError && <Alert variant="destructive">Error: {apiError}</Alert>}

        <Card className="border-border/80">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <span className="text-sm font-medium text-foreground">
              Profile Visibility:{' '}
              <strong>{profileData.profile.is_hidden ? 'Hidden' : 'Visible'}</strong>
            </span>
            <Button
              onClick={handleToggleVisibility}
              disabled={isVisibilityUpdating}
              variant={profileData.profile.is_hidden ? 'secondary' : 'outline'}
              size="sm"
            >
              {isVisibilityUpdating
                ? 'Updating...'
                : profileData.profile.is_hidden
                ? 'Make Visible'
                : 'Hide Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Profile Data Display */}
        {isEditing ? (
            <ProfileEditView
                initialProfileData={profileData!} // Pass the loaded profile data
                onSave={handleEditSave}           // Pass the save handler
                onCancel={handleEditCancel}       // Pass the cancel handler
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Photo and Basic Info */}
              <div className="md:col-span-1 flex flex-col items-center"> {/* Added flex container for centering text fallback */}
                <PhotoWithFallbacks
                  src={profileData.profile.photo_w192 || ''} // Pass the photo URL or empty string
                  alt={`Profile picture of ${profileData.profile.name}`}
                  className="w-32 h-32 rounded-full object-cover mx-auto" // Pass Tailwind classes
                />
                <h2 className="text-xl font-semibold text-center mt-2">{profileData.profile.name}</h2>
                <p className="text-gray-600 text-center">({profileData.profile.is_hidden ? 'Hidden' : 'Visible'})</p>
              </div>

              {/* Main Details */}
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Birth Date</p>
                    <p className="font-medium">{profileData.about.birth_date || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-medium">{formatGender(profileData.about.gender)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Is Couple</p>
                    <p className="font-medium">{formatBoolean(profileData.about.is_couple)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Has Children</p>
                    <p className="font-medium">{formatBoolean(profileData.about.has_children)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Occupation</p>
                    <p className="font-medium">{formatOccupation(profileData.about.occupation_type)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Drinking Level</p>
                    <p className="font-medium">{formatLevel(profileData.about.drinking_level, 'drinking')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Smoking Level</p>
                    <p className="font-medium">{formatLevel(profileData.about.smoking_level, 'smoking')}</p>
                  </div>
                  {/* Add Smoking Type List */}
                  {profileData.about.smoking_level !== null && profileData.about.smoking_level > 1 && (
                    <div>
                      <p className="text-sm text-gray-500">Smoking Types</p>
                      <p className="font-medium text-gray-900"> {/* Standard text color, not indigo */}
                        {formatSmokingTypes(
                          profileData.about.smokes_iqos,
                          profileData.about.smokes_vape,
                          profileData.about.smokes_tobacco,
                          profileData.about.smokes_cigs
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {/* Rent Preferences */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Rent Preferences</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Min Budget</p>
                      <p className="font-medium">{profileData.rent_preferences.min_budget}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Max Budget</p>
                      <p className="font-medium">{profileData.rent_preferences.max_budget}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Min Duration</p>
                      <p className="font-medium">{formatLevel(profileData.rent_preferences.min_rent_duration_level, 'duration')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Max Duration</p>
                      <p className="font-medium">{formatLevel(profileData.rent_preferences.max_rent_duration_level, 'duration')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Room Sharing</p>
                      <p className="font-medium">{formatLevel(profileData.rent_preferences.room_sharing_level, 'room_sharing')}</p>
                    </div>
                  </div>
                  <div className="mt-2">
                      <p className="text-sm text-gray-500">Locations</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                          {profileData.rent_preferences.locations ? (
                            // Call the function to get the processed array
                            prepareLocationsForDisplay(profileData.rent_preferences.locations).length > 0 ? (
                              // Map over the processed array
                              prepareLocationsForDisplay(profileData.rent_preferences.locations).map(
                                (item: DisplayLocation, index: number) => (
                                  <span
                                    key={`${item.type}-${index}`} // Use type and index for a more specific key
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                                  >
                                    {item.displayName} {/* Render the pre-formatted display name */}
                                  </span>
                                )
                              )
                            ) : (
                              // Or show default if the processed array is empty
                              <p className="text-gray-600">Вся Україна (Default)</p>
                            )
                          ) : (
                            // Handle case where profileData.rent_preferences.locations is null/undefined
                            <p className="text-gray-600">Вся Україна (Default)</p>
                          )}
                      </div>
                  </div>
                </div>

                {/* Other Details */}
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Other Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Neighbourliness</p>
                      <p className="font-medium">{formatLevel(profileData.about.neighbourliness_level, 'neighbourliness')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Guests Level</p>
                      <p className="font-medium">{formatLevel(profileData.about.guests_level, 'guests')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Parties Level</p>
                      <p className="font-medium">{formatLevel(profileData.about.parties_level, 'parties')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Bedtime Level</p>
                      <p className="font-medium">{formatLevel(profileData.about.bedtime_level, 'bedtime')}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Neatness Level</p>
                      <p className="font-medium">{formatLevel(profileData.about.neatness_level, 'neatness')}</p>
                    </div>
                    {/* Pet Checkboxes - Display as a list */}
                    <div className="col-span-2"> {/* Use col-span-2 to make it full width */}
                      <p className="text-sm text-gray-500">Animals</p>
                      <p className="font-medium text-gray-900"> {/* Standard text color */}
                        {[
                          profileData.about.has_cats && 'Cats',
                          profileData.about.has_dogs && 'Dogs',
                          profileData.about.has_reptiles && 'Reptiles',
                          profileData.about.has_birds && 'Birds',
                        ].filter(Boolean).join(', ') || 'None'} {/* Filter out falsy values and join, default to 'None' */}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Other Animals</p>
                      <p className="font-medium">{joinArray(profileData.about.other_animals)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Interests</p>
                      <p className="font-medium">{joinArray(profileData.about.interests)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Bio</p>
                      <p className="font-medium break-words">{profileData.about.bio || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


        {/* Delete Button */}
        <div className="flex justify-end mt-6">
          <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)} size="sm">
            Delete Profile & Account
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay: Semi-transparent background - Ensure it dims the content */}
            {/* Use fixed positioning, cover the screen, and apply opacity for dimming */}
            <div 
              className="fixed inset-0 bg-gray-500 transition-opacity" 
              style={{ opacity: 0.75 }} // Explicitly set opacity to ensure dimming effect
              aria-hidden="true"
              // Optional: Add an onClick handler here to close the modal when clicking the overlay
              // onClick={() => setIsDeleteModalOpen(false)}
            >
            </div>

            {/* Spacer element for vertical centering (hidden) */}
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203</span>

            {/* Main Modal Content Container - Ensure it's above the overlay */}
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full relative z-[51]"> {/* Increased z-index slightly to ensure it's above the overlay */}
              {/* Inner Content Div */}
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      Delete Profile & Account
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete your profile and account? This action cannot be undone. All your data will be permanently removed.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Footer with Buttons */}
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <Button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  variant="destructive"
                  className="w-full sm:w-auto"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(false)} // Close the modal
                  className="mt-3 w-full sm:mt-0 sm:ml-3 sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
