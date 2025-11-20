'use client'


import { useState, useEffect, ReactNode, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { getProfile, updateProfileVisibility } from '@/lib/shallwe/profile/api/calls' // Import read and visibility API calls
import { deleteUser } from '@/lib/shallwe/auth/api/calls' // Import delete API call
import { ProfileReadData } from '@/lib/shallwe/profile/api/schema/read' // Import the read data type
import { ApiError } from '@/lib/shallwe/common/api/calls' // Import ApiError type
import { ProfileEditView } from '../components/profile/ProfileEditView'
import PhotoWithFallbacks from '../components/ui/PhotoWithFallbacks'
import { LocationsReadFields } from '@/lib/shallwe/locations/api/schema'
import { Button } from '@/app/components/ui/primitives/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/primitives/card'
import { Alert } from '@/app/components/ui/primitives/alert'
import { Stack } from '@/app/components/ui/primitives/stack'
import { Section } from '@/app/components/ui/primitives/section'
import { MetaPill } from '@/app/components/ui/primitives/meta-pill'
import { FormField } from '@/app/components/ui/primitives/form-field'
import { cn } from '@/lib/utils'


interface DisplayLocation {
  type: 'region' | 'city' | 'district' | 'other_ppl';
  displayName: string;
}


const prepareLocationsForDisplay = (locationsObject: LocationsReadFields): DisplayLocation[] => {
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

type InfoItem = {
  label: string
  value: ReactNode
  fullWidth?: boolean
}

const InfoGrid = ({ items }: { items: InfoItem[] }) => (
  <div className="grid gap-3 md:grid-cols-2">
    {items.map((item, index) => {
      const resolvedValue = item.value ?? 'Not specified'
      const isPrimitive = typeof resolvedValue === 'string' || typeof resolvedValue === 'number'

      return (
        <FormField
          key={`${item.label}-${index}`}
          label={item.label}
          className={cn(item.fullWidth && 'md:col-span-2')}
        >
          {isPrimitive ? (
            <p className="text-sm font-semibold text-foreground">{resolvedValue}</p>
          ) : (
            resolvedValue
          )}
        </FormField>
      )
    })}
  </div>
)


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

  const fetchProfile = useCallback(async () => {
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
  }, [router])

  // Fetch profile data on component mount
  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

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
  const formatBoolean = (value: boolean | null | undefined): string => {
    if (value === null || value === undefined) return 'Not specified'
    return value ? 'Yes' : 'No'
  }

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
    if (!items || items.length === 0) return 'None'
    const value = items.join(', ').trim()
    return value.length > 0 ? value : 'None'
  }
  // --- END HELPER FUNCTIONS ---

  // --- RENDER LOGIC ---
  if (isLoading) {
    return (
      <Section as="div" className="flex items-center justify-center" fullWidth>
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-8 text-sm text-muted-foreground">Loading your profile…</CardContent>
        </Card>
      </Section>
    )
  }

  if (!profileData) {
    return (
      <Section as="div" className="flex items-center justify-center" fullWidth>
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle>Profile not found</CardTitle>
          </CardHeader>
          <CardContent>
            <Stack gap="sm">
              <p className="text-sm text-muted-foreground">We couldn&apos;t load your profile data.</p>
              {apiError && <Alert variant="destructive">{apiError}</Alert>}
              <Button onClick={() => router.push('/')} className="w-full">
                Go to landing
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Section>
    )
  }

  const processedLocations = profileData.rent_preferences.locations
    ? prepareLocationsForDisplay(profileData.rent_preferences.locations)
    : []

  const animalsSummary =
    [
      profileData.about.has_cats && 'Cats',
      profileData.about.has_dogs && 'Dogs',
      profileData.about.has_reptiles && 'Reptiles',
      profileData.about.has_birds && 'Birds',
    ]
      .filter(Boolean)
      .join(', ') || 'None'

  const aboutItems: InfoItem[] = [
    { label: 'Birth Date', value: profileData.about.birth_date || 'Not specified' },
    { label: 'Gender', value: formatGender(profileData.about.gender) },
    { label: 'Is Couple', value: formatBoolean(profileData.about.is_couple) },
    { label: 'Has Children', value: formatBoolean(profileData.about.has_children) },
    { label: 'Occupation', value: formatOccupation(profileData.about.occupation_type) },
    { label: 'Drinking Level', value: formatLevel(profileData.about.drinking_level, 'drinking') },
    { label: 'Smoking Level', value: formatLevel(profileData.about.smoking_level, 'smoking') },
  ]

  if (profileData.about.smoking_level !== null && profileData.about.smoking_level > 1) {
    aboutItems.push({
      label: 'Smoking Types',
      value:
        formatSmokingTypes(
          profileData.about.smokes_iqos,
          profileData.about.smokes_vape,
          profileData.about.smokes_tobacco,
          profileData.about.smokes_cigs
        ) || 'None',
    })
  }

  const rentItems: InfoItem[] = [
    { label: 'Min Budget', value: profileData.rent_preferences.min_budget ?? 'Not specified' },
    { label: 'Max Budget', value: profileData.rent_preferences.max_budget ?? 'Not specified' },
    {
      label: 'Min Duration',
      value: formatLevel(profileData.rent_preferences.min_rent_duration_level, 'duration'),
    },
    {
      label: 'Max Duration',
      value: formatLevel(profileData.rent_preferences.max_rent_duration_level, 'duration'),
    },
    {
      label: 'Room Sharing',
      value: formatLevel(profileData.rent_preferences.room_sharing_level, 'room_sharing'),
    },
  ]

  const lifestyleItems: InfoItem[] = [
    {
      label: 'Neighbourliness',
      value: formatLevel(profileData.about.neighbourliness_level, 'neighbourliness'),
    },
    { label: 'Guests Level', value: formatLevel(profileData.about.guests_level, 'guests') },
    { label: 'Parties Level', value: formatLevel(profileData.about.parties_level, 'parties') },
    { label: 'Bedtime Level', value: formatLevel(profileData.about.bedtime_level, 'bedtime') },
    { label: 'Neatness Level', value: formatLevel(profileData.about.neatness_level, 'neatness') },
    { label: 'Animals', value: animalsSummary, fullWidth: true },
    { label: 'Other Animals', value: joinArray(profileData.about.other_animals), fullWidth: true },
    { label: 'Interests', value: joinArray(profileData.about.interests), fullWidth: true },
    {
      label: 'Bio',
      value: (
        <p className="text-sm font-medium text-foreground break-words whitespace-pre-line">
          {profileData.about.bio?.trim() || 'Not specified'}
        </p>
      ),
      fullWidth: true,
    },
  ]

  const visibilityLabel = profileData.profile.is_hidden ? 'Hidden' : 'Visible'
  const visibilityHint = profileData.profile.is_hidden ? 'Only you can see this.' : 'Matches can view it.'
  const visibilityDotClass = profileData.profile.is_hidden ? 'bg-warning' : 'bg-success'

  // --- MAIN RENDER (Profile Data Loaded) ---
  return (
    <Section as="div" className="bg-background-soft" fullWidth>
      <Stack gap={isEditing ? 'xs' : 'sm'} className="mx-auto w-full max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Stack gap="xs">
            <h1 className="text-base font-semibold text-foreground">Profile & visibility</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
              <span className={`h-2.5 w-2.5 rounded-full ${visibilityDotClass}`} aria-hidden />
              <span>{visibilityLabel}</span>
              <span className="text-sm font-normal text-muted-foreground">{visibilityHint}</span>
            </div>
          </Stack>
          <div className="flex flex-wrap items-center gap-2">
            {isEditing ? (
              <Button onClick={handleEditCancel} size="sm">
                Cancel editing
              </Button>
            ) : (
              <Button onClick={handleEditClick} size="sm">
                Edit profile
              </Button>
            )}
          </div>
        </div>

        {apiError && <Alert variant="destructive">Error: {apiError}</Alert>}

        {isEditing ? (
          <ProfileEditView
            initialProfileData={profileData!}
            onSave={handleEditSave}
            onCancel={handleEditCancel}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <Card className="text-center md:col-span-1">
              <CardContent className="flex flex-col items-center gap-3 p-4">
                <PhotoWithFallbacks
                  src={profileData.profile.photo_w192 || ''}
                  alt={`Profile picture of ${profileData.profile.name}`}
                  className="h-32 w-32 rounded-full object-cover"
                />
                <Stack gap="xs" className="w-full text-center">
                  <h2 className="text-base font-semibold">{profileData.profile.name}</h2>
                </Stack>
                <div className="flex w-full flex-col gap-2 text-left">
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <span className={`h-2.5 w-2.5 rounded-full ${visibilityDotClass}`} aria-hidden />
                    <span className="font-semibold">{visibilityLabel}</span>
                    <span className="text-muted-foreground">{visibilityHint}</span>
                  </div>
                  <Button
                      onClick={handleToggleVisibility}
                      disabled={isVisibilityUpdating}
                      variant={profileData.profile.is_hidden ? 'secondary' : 'outline'}
                      size="sm"
                      className="self-start"
                    >
                      {isVisibilityUpdating
                        ? 'Updating…'
                        : profileData.profile.is_hidden
                        ? 'Show profile'
                        : 'Hide profile'}
                    </Button>
                  </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="p-4">
                <Stack gap="sm">
                  <Stack gap="xs">
                    <h3 className="text-base font-semibold text-foreground">Profile essentials</h3>
                  </Stack>
                  <InfoGrid items={aboutItems} />

                  <div className="pt-4">
                    <Stack gap="sm">
                      <Stack gap="xs">
                        <h3 className="text-base font-semibold text-foreground">Rent preferences</h3>
                      </Stack>
                      <InfoGrid items={rentItems} />
                      <FormField label="Locations" hint="Matches only appear from these areas.">
                        {processedLocations.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {processedLocations.map((item: DisplayLocation, index: number) => (
                              <MetaPill key={`${item.type}-${index}`} className="normal-case">
                                {item.displayName}
                              </MetaPill>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm font-medium text-muted-foreground">All Ukraine (default)</p>
                        )}
                      </FormField>
                    </Stack>
                  </div>

                  <div className="pt-4">
                    <Stack gap="sm">
                      <Stack gap="xs">
                        <h3 className="text-base font-semibold text-foreground">Lifestyle & interests</h3>
                      </Stack>
                      <InfoGrid items={lifestyleItems} />
                    </Stack>
                  </div>
                </Stack>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Stack gap="xs">
              <p className="text-sm font-semibold text-destructive">Delete account</p>
              <p className="text-sm text-muted-foreground">Remove your profile and access instantly. This can’t be undone.</p>
            </Stack>
            <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)} size="sm" className="sm:w-auto">
              Delete account
            </Button>
          </div>
        </div>
      </Stack>

      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-overlay"
            aria-hidden="true"
            onClick={() => setIsDeleteModalOpen(false)}
          />
          <Card className="relative z-10 w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive-soft text-destructive">
                  <svg
                    className="h-6 w-6"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-base">Delete account</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    This permanently removes your profile, matches, and account access.
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                variant="destructive"
                className="w-full sm:w-auto"
              >
                {isDeleting ? 'Deleting…' : 'Delete account'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </Section>
  )
}
