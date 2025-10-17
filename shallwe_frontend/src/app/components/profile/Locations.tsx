import React, { useState, useEffect, useCallback } from 'react'

import { TagsInput } from 'react-tag-input-component'
import { searchLocations } from '@/lib/shallwe/locations/api/calls'
import { GenericLocationReadFields, LocationsReadFields } from '@/lib/shallwe/locations/api/schema'


interface LocationSearchProps {
  selectedLocations: string[]
  onLocationsChange: (newLocations: string[]) => void
  error?: string
  onClearError: () => void
}


const Locations: React.FC<LocationSearchProps> = ({
  selectedLocations,
  onLocationsChange,
  error,
  onClearError,
}) => {

  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<LocationsReadFields | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [searchError, setSearchError] = useState<string | null>(null)


  const areOverlappingHierarchies = (h1: string, h2: string): boolean => {
    return h1.startsWith(h2) || h2.startsWith(h1)
  }

  // Function to handle selecting a location from search results
  const handleSelectLocation = (selectedHierarchy: string) => {
    onClearError() // Clear any validation error when user makes a selection
    setSearchError(null) // Clear search-specific error

    // Find the location object in the results to get its name/type for display (optional, for debugging/logic clarity)
    let foundLocation: GenericLocationReadFields | undefined
    if (searchResults) {
        // Search in regions
        foundLocation = searchResults.regions?.find(r => r.hierarchy === selectedHierarchy)
        if (!foundLocation) {
             // Search in cities and their districts
             for (const city of (searchResults.cities || [])) {
                 if (city.hierarchy === selectedHierarchy) {
                     foundLocation = city
                     break
                 }
                 const foundDistrict = city.districts?.find(d => d.hierarchy === selectedHierarchy)
                 if (foundDistrict) {
                     foundLocation = foundDistrict
                     break
                 }
             }
        }
        if (!foundLocation) {
             // Search in other_ppls
             foundLocation = searchResults.other_ppls?.find(op => op.hierarchy === selectedHierarchy)
        }
    }

    if (foundLocation) {
        let displayName = selectedHierarchy
        if ('region_name' in foundLocation && foundLocation.region_name) {
            displayName = foundLocation.region_name
        } else if ('ppl_name' in foundLocation && foundLocation.ppl_name) {
            displayName = foundLocation.ppl_name
        } else if ('district_name' in foundLocation && foundLocation.district_name) {
            displayName = foundLocation.district_name
        } else if ('subregion_name' in foundLocation && foundLocation.subregion_name) {
            displayName = foundLocation.subregion_name
        }
        console.log(`Selecting location: ${displayName} (${selectedHierarchy})`)
    }

    // Apply overlap logic: Remove any existing selected locations that overlap with the new one
    const newLocations = selectedLocations.filter(existingHierarchy => !areOverlappingHierarchies(selectedHierarchy, existingHierarchy))

    // Add the new location to the list
    newLocations.push(selectedHierarchy)

    // Update parent state
    onLocationsChange(newLocations)

    // Clear search input and results after selection
    setSearchQuery('')
    setSearchResults(null)
  }

  // Function to handle removing a selected location tag
  const handleRemoveLocation = (hierarchyToRemove: string) => {
    onClearError() // Clear any validation error when user makes a change
    const newLocations = selectedLocations.filter(h => h !== hierarchyToRemove)
    onLocationsChange(newLocations)
  }

  // Debounced search function
  const debouncedSearch = useCallback(
    (query: string) => {
      const search = async () => {
        if (query.length < 2) {
          setSearchResults(null)
          setSearchError(null)
          return
        }

        setIsLoading(true)
        setSearchError(null)

        try {
          const results = await searchLocations(query)
          setSearchResults(results)
        } catch (err) {
          console.error("Error searching locations:", err)
          setSearchResults(null)
          setSearchError('Failed to search locations. Please try again.')
          // Optionally set a specific error state here if needed
        } finally {
          setIsLoading(false)
        }
      }

      search()
    },
    [] // No dependencies, relies on current state captured by useCallback
  )

  // Handle search input change with debounce
  useEffect(() => {
    // Clear results if query goes below 2 characters
    if (searchQuery.length < 2) {
      setSearchResults(null)
      setSearchError(null)
      return
    }

    // Debounce search - use a timeout or a library like lodash.debounce
    const timer = setTimeout(() => {
      debouncedSearch(searchQuery)
    }, 300) // 300ms delay

    return () => clearTimeout(timer) // Cleanup timeout on subsequent calls or unmount
  }, [searchQuery, debouncedSearch])

  // Determine if "Вся Україна" tag should be shown
  const showAllUkraineTag = selectedLocations.length === 0

  return (
    <div className="space-y-2">
      <label htmlFor="location-search" className="block text-sm font-medium text-gray-700">
        Search Locations (e.g., "Київ")
      </label>
      <div className="relative">
        <input
          type="text"
          id="location-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Enter location..."
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            searchError ? 'border-red-500' : ''
          }`}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            {/* Simple loading spinner */}
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>
      {searchError && <p className="mt-1 text-sm text-red-600">{searchError}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Selected Tags */}
      <div className="mt-2">
        {showAllUkraineTag ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Вся Україна (Default)
          </span>
        ) : (
          <TagsInput
            value={selectedLocations}
            onChange={onLocationsChange} // This might interfere with our overlap logic if the library allows direct editing of strings
            // Instead, we'll manage removals via the handleRemoveLocation function below
            // and only use TagsInput for display, handling add/remove separately.
            // Let's use a custom tag rendering approach or a different library part.
            // For now, let's map manually.
            // Or, use the 'onRemove' prop of TagsInput if available and compatible.
            onRemoved={handleRemoveLocation} // Use the custom remove handler
            placeHolder="" // No placeholder for the input part as we manage search separately
            disabled={false} // Allow removing tags
            classNames={{
              tag: "bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm",
              input: "mt-0 block w-full p-0 text-sm focus:outline-none",
            }}
          />
        )}
        {/* Manual tag rendering for full control */}
        {!showAllUkraineTag && selectedLocations.map((loc, index) => (
          <span
            key={index} // Using index is acceptable here as locations are unique strings and order might matter visually, but hierarchy string would be better if guaranteed unique *for this list* and stable. Index is fine for now.
            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 mr-2 mb-2"
          >
            {loc} {/* Display the hierarchy string, consider mapping to a readable name if available */}
            <button
              type="button"
              onClick={() => handleRemoveLocation(loc)}
              className="flex-shrink-0 ml-1 h-4 w-4 rounded-full inline-flex items-center justify-center text-indigo-600 hover:bg-indigo-200 hover:text-indigo-800 focus:outline-none"
            >
              <span className="sr-only">Remove</span>
              <svg className="h-3 w-3" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      {/* Search Results */}
      {searchResults && (
        <div className="mt-2 border border-gray-200 rounded-md max-h-60 overflow-y-auto">
          {/* Regions */}
          {searchResults.regions && searchResults.regions.length > 0 && (
            <div className="p-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Regions</h3>
              {searchResults.regions.map((region) => (
                <div
                  key={region.hierarchy}
                  onClick={() => handleSelectLocation(region.hierarchy)}
                  className={`p-2 text-sm cursor-pointer hover:bg-gray-100 ${
                    selectedLocations.includes(region.hierarchy) ? 'bg-green-100' : ''
                  }`}
                >
                  <span className="ml-0">{region.region_name}</span> {/* Adjust margin as needed for hierarchy */}
                </div>
              ))}
            </div>
          )}
          {/* Cities and Districts */}
          {searchResults.cities && searchResults.cities.length > 0 && (
            <div className="p-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cities</h3>
              {searchResults.cities.map((city) => (
                <React.Fragment key={city.hierarchy}>
                  <div
                    onClick={() => handleSelectLocation(city.hierarchy)}
                    className={`p-2 text-sm cursor-pointer hover:bg-gray-100 ${
                      selectedLocations.includes(city.hierarchy) ? 'bg-green-100' : ''
                    }`}
                  >
                    <span className="ml-0">{city.ppl_name}, {city.region_name}</span> {/* Adjust margin */}
                  </div>
                  {/* Districts */}
                  {city.districts && city.districts.length > 0 && (
                    <div className="ml-4"> {/* Indent districts */}
                      {city.districts.map((district) => (
                        <div
                          key={district.hierarchy}
                          onClick={() => handleSelectLocation(district.hierarchy)}
                          className={`p-2 text-sm cursor-pointer hover:bg-gray-100 ${
                            selectedLocations.includes(district.hierarchy) ? 'bg-green-100' : ''
                          }`}
                        >
                          <span className="ml-0">{district.district_name}</span> {/* Adjust margin */}
                        </div>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          {/* Other PPLs */}
          {searchResults.other_ppls && searchResults.other_ppls.length > 0 && (
            <div className="p-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Other</h3>
              {searchResults.other_ppls.map((otherPpl) => (
                <div
                  key={otherPpl.hierarchy}
                  onClick={() => handleSelectLocation(otherPpl.hierarchy)}
                  className={`p-2 text-sm cursor-pointer hover:bg-gray-100 ${
                    selectedLocations.includes(otherPpl.hierarchy) ? 'bg-green-100' : ''
                  }`}
                >
                  <span className="ml-0">
                    {otherPpl.ppl_name}{otherPpl.subregion_name ? `, ${otherPpl.subregion_name}` : ''}, {otherPpl.region_name}
                  </span> {/* Adjust margin */}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Locations
