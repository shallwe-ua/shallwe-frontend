'use client'


import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

import { getProfile, updateProfileVisibility } from '@/lib/shallwe/profile/api/calls' // Import read and visibility API calls
import { deleteUser } from '@/lib/shallwe/auth/api/calls' // Import delete API call
import { ProfileReadData } from '@/lib/shallwe/profile/api/schema/read' // Import the read data type
import { ApiError } from '@/lib/shallwe/common/api/calls' // Import ApiError type
import { ProfileEditView } from '../components/profile/ProfileEditView'
import PhotoWithFallbacks from '../components/profile/PhotoWithFallbacks'


export default function SettingsPage() {

  const [profileData, setProfileData] = useState<ProfileReadData | null>(null)
  const [isLoading, setIsLoading] = useState(true) // Add loading state
  const [isVisibilityUpdating, setIsVisibilityUpdating] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const router = useRouter()

  const defaultProfileImage = "/img/profile/default192.webp"
  const [defaultImageFailed, setDefaultImageFailed] = useState(false)

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
      <div className="min-h-screen bg-gradient-to-br from-background-white to-primary-blue flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-lg text-gray-700">Loading your profile...</p>
        </div>
      </div>
    )
  }

  if (!profileData) {
    // This state should ideally be handled by the error check in useEffect leading to a redirect,
    // but render a message just in case.
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-white to-primary-blue flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center text-black">Profile Not Found</h1>
          <p className="text-center text-gray-600">We couldn't load your profile data.</p>
          {apiError && <p className="text-center text-red-600">{apiError}</p>}
          <button
            onClick={() => router.push('/')} // Fallback redirect button
            className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  // --- MAIN RENDER (Profile Data Loaded) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-background-white to-primary-blue flex flex-col items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-md p-8 space-y-6">
        <div className="flex justify-between items-start">
          <h1 className="text-2xl font-bold text-black">Your Profile Settings</h1>
          {/* Show Edit button only when not editing */}
          {!isEditing && (
              <button
                  onClick={handleEditClick}
                  className="ml-3 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                  Edit
              </button>
          )}
        </div>

        {/* API Error Display */}
        {apiError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">Error: {apiError}</span>
          </div>
        )}

        {/* Profile Visibility Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium text-gray-700">
            Profile Visibility: <strong>{profileData.profile.is_hidden ? 'Hidden' : 'Visible'}</strong>
          </span>
          <button
            onClick={handleToggleVisibility}
            disabled={isVisibilityUpdating}
            className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
              isVisibilityUpdating ? 'bg-gray-400' : profileData.profile.is_hidden ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              profileData.profile.is_hidden ? 'focus:ring-green-500' : 'focus:ring-yellow-500'
            }`}
          >
            {isVisibilityUpdating
              ? 'Updating...'
              : profileData.profile.is_hidden
              ? 'Make Visible'
              : 'Hide Profile'}
          </button>
        </div>

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
                          {profileData.rent_preferences.locations &&
                          (profileData.rent_preferences.locations.regions?.length > 0 ||
                            profileData.rent_preferences.locations.cities?.length > 0 ||
                            profileData.rent_preferences.locations.other_ppls?.length > 0) ? (
                              <>
                                  {profileData.rent_preferences.locations.regions?.map((region, index) => (
                                      <span key={`region-${index}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          {region.region_name}
                                      </span>
                                  ))}
                                  {profileData.rent_preferences.locations.cities?.map((city, index) => (
                                      <span key={`city-${index}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          {city.ppl_name}, {city.region_name}
                                      </span>
                                  ))}
                                  {profileData.rent_preferences.locations.other_ppls?.map((otherPpl, index) => (
                                      <span key={`other_ppl-${index}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                          {otherPpl.ppl_name}{otherPpl.subregion_name ? `, ${otherPpl.subregion_name}` : ''}, {otherPpl.region_name}
                                      </span>
                                  ))}
                              </>
                          ) : (
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
                    <div>
                      <p className="text-sm text-gray-500">Has Cats</p>
                      <p className="font-medium">{formatBoolean(profileData.about.has_cats)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Has Dogs</p>
                      <p className="font-medium">{formatBoolean(profileData.about.has_dogs)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Has Reptiles</p>
                      <p className="font-medium">{formatBoolean(profileData.about.has_reptiles)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Has Birds</p>
                      <p className="font-medium">{formatBoolean(profileData.about.has_birds)}</p>
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
                      <p className="font-medium">{profileData.about.bio || 'Not specified'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


        {/* Delete Button */}
        <div className="flex justify-end mt-6">
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete Profile & Account
          </button>
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
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                    isDeleting ? 'bg-gray-400' : 'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                  }`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)} // Close the modal
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}