import React, { useState, useEffect, useCallback, useRef } from 'react'
import { searchLocations } from '@/lib/shallwe/locations/api/calls'
import { LocationsReadFields, GenericLocationReadFields } from '@/lib/shallwe/locations/api/schema'
import { ApiError } from '@/lib/shallwe/common/api/calls'

interface LocationsProps {
  selectedLocations: string[]
  initialLocationNames?: Record<string, string>
  onLocationsChange: (newLocations: string[]) => void
  error?: string
  onClearError: () => void
}

const MAX_LOCATIONS = 30;

const Locations: React.FC<LocationsProps> = ({
  selectedLocations,
  initialLocationNames,
  onLocationsChange,
  error,
  onClearError,
}) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<LocationsReadFields | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [nameMap, setNameMap] = useState<Record<string, string>>(initialLocationNames || {})
  const [isInputFrozen, setIsInputFrozen] = useState(false);
  const [isCounterSwinging, setIsCounterSwinging] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null)

  // 🧠 Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false)
        setIsInputFrozen(false);
        setIsCounterSwinging(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const areOverlappingHierarchies = (h1: string, h2: string) => {
    return h1.startsWith(h2) || h2.startsWith(h1)
  }

  const handleSelectLocation = (selectedHierarchy: string, displayName: string) => {
    if (selectedLocations.length >= MAX_LOCATIONS && !selectedLocations.includes(selectedHierarchy)) {
      setIsInputFrozen(true);
      setIsCounterSwinging(true);
      setTimeout(() => setIsCounterSwinging(false), 500); // Swing animation duration
      return;
    }

    onClearError()
    setSearchError(null)

    // Toggle if already selected
    let newLocations: string[]
    if (selectedLocations.includes(selectedHierarchy)) {
      newLocations = selectedLocations.filter((h) => h !== selectedHierarchy)
    } else {
      // Remove overlapping ones
      newLocations = selectedLocations.filter(
        (existingHierarchy) => !areOverlappingHierarchies(selectedHierarchy, existingHierarchy)
      )
      newLocations.push(selectedHierarchy)
      setNameMap((prev) => ({ ...prev, [selectedHierarchy]: displayName }))
    }

    onLocationsChange(newLocations)
    // Only unfreeze if we're below the limit
    if (newLocations.length < MAX_LOCATIONS) {
      setIsInputFrozen(false);
      setIsCounterSwinging(false);
    }
  }

  const handleRemoveLocation = (hierarchyToRemove: string) => {
    onClearError()
    const newLocations = selectedLocations.filter((h) => h !== hierarchyToRemove)
    onLocationsChange(newLocations)
    
    // Unfreeze input when removing a location since we're now below the limit
    setIsInputFrozen(false);
    setIsCounterSwinging(false);
  }

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
          setShowResults(true)
        } catch (err) {
          console.error('Error searching locations:', err)
          setSearchResults(null)
          const apiError = err as ApiError
          if ('status' in apiError && apiError.status === 404) {
            setSearchError('No locations matching this query. Please check the spelling.')
          }
          else setSearchError(`Error trying to search locations: ${apiError.message}`)
        } finally {
          setIsLoading(false)
        }
      }

      search()
    },
    []
  )

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults(null)
      setSearchError(null)
      return
    }
    const timer = setTimeout(() => {
      debouncedSearch(searchQuery)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, debouncedSearch])

  const showAllUkraineTag = selectedLocations.length === 0

  const getDisplayName = (entity: GenericLocationReadFields, type: 'region' | 'city' | 'other_ppl' | 'district', parentCity?: { ppl_name: string }): string => {
    switch (type) {
      case 'region':
        return entity.region_name ?? '';
      case 'city':
        // Big cities: City Name (Region Name)
        return `${entity.ppl_name} (${entity.region_name})`;
      case 'district':
        if (!parentCity) {
          console.error("getDisplayName: parentCity is required for type 'district'", { entity, type, parentCity });
          // Return a fallback string indicating the error, or just the district name
          // Returning just the district name might be less disruptive than showing an error string like "[Missing Parent City]"
          return `${entity.district_name} ${entity.hierarchy}` || `[Missing Parent City for ${entity.hierarchy}]`
        }
        // Districts: City Name, District Name (e.g., Київ, Подільский)
        // parentCity is expected for districts
        return `${parentCity.ppl_name}, ${entity.district_name}`
      case 'other_ppl':
        // Other PPLs: Name (Region, Subregion) or Name (Region)
        const suffix = entity.subregion_name ? `${entity.region_name}, ${entity.subregion_name}` : entity.region_name;
        return `${entity.ppl_name} (${suffix})`;
      default:
        // Fallback to hierarchy string if type is unknown
        return entity.hierarchy || '';
    }
  };

  // Simplified render item function that just receives the display name string
  const renderResultItem = (hierarchy: string, displayName: string) => (
    <div
      key={hierarchy}
      onClick={() => handleSelectLocation(hierarchy, displayName)} // Pass the pre-formatted display name
      className={`p-2 text-sm cursor-pointer hover:bg-gray-100 ${
        selectedLocations.includes(hierarchy) ? 'bg-green-100 hover:bg-green-200' : ''
      } ${selectedLocations.length >= MAX_LOCATIONS && !selectedLocations.includes(hierarchy) ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {displayName}
    </div>
  );

  return (
    <div className="space-y-2 relative" ref={wrapperRef}>
      {/* Search field */}
      <div className="relative">
        <input
          type="text"
          id="location-search"
          value={searchQuery}
          onChange={(e) => {
            if (!isInputFrozen) {
              setSearchQuery(e.target.value);
            }
          }}
          placeholder="Enter location..."
          onFocus={() => {
            if (selectedLocations.length >= MAX_LOCATIONS) {
              setIsInputFrozen(true);
              setIsCounterSwinging(true);
              setTimeout(() => setIsCounterSwinging(false), 500);
            } else {
              searchResults && setShowResults(true);
            }
          }}
          className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
            isInputFrozen 
              ? 'border-red-500 bg-red-50 cursor-not-allowed' 
              : searchError 
                ? 'border-red-500' 
                : 'border-gray-300'
          }`}
          disabled={isInputFrozen}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          </div>
        )}
      </div>

      {searchError && <p className="mt-1 text-sm text-gray-400">{searchError}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Location Counter */}
      <div className={`text-sm font-medium text-gray-400 transition-colors duration-300 flex justify-between items-center`}>
        <span 
          className={`inline-block ${isCounterSwinging ? 'animate-pulse text-red-600' : ''}`}
        >
          {selectedLocations.length}/{MAX_LOCATIONS} locations picked
        </span>
        {selectedLocations.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onLocationsChange([]);
              setNameMap({});
              setIsInputFrozen(false);
              setIsCounterSwinging(false);
            }}
            className="text-sm text-gray-400 hover:text-gray-700 cursor-pointer underline"
          >
            clear all &times;
          </button>
        )}
      </div>

      {/* Search Results Dropdown (absolute overlay) */}
      {showResults && searchResults && (
        <div
          className="absolute left-0 right-0 bg-white border border-gray-200 rounded-md max-h-60 overflow-y-auto z-50 shadow-lg"
        >
          {/* Regions */}
          {searchResults.regions && searchResults.regions.length > 0 && (
            <div className="p-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Regions</h3>
              {searchResults.regions.map((region) => {
                const displayName = getDisplayName(region, 'region');
                return renderResultItem(region.hierarchy, displayName);
              })}
            </div>
          )}
          {/* Cities */}
          {searchResults.cities && searchResults.cities.length > 0 && (
            <div className="p-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Cities</h3>
              {searchResults.cities.map((city) => (
                <React.Fragment key={city.hierarchy}>
                  {/* Render the main city */}
                  {renderResultItem(city.hierarchy, getDisplayName(city, 'city'))}
                  {/* Render nested districts */}
                  {city.districts && city.districts.length > 0 && (
                    <div className="ml-4">
                      {city.districts.map((district) => {
                        const displayName = getDisplayName(district, 'district', city); // Pass the parent city
                        return renderResultItem(district.hierarchy, displayName);
                      })}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          {/* Other */}
          {searchResults.other_ppls && searchResults.other_ppls.length > 0 && (
            <div className="p-2">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">Other</h3>
              {searchResults.other_ppls.map((ppl) => {
                const displayName = getDisplayName(ppl, 'other_ppl');
                return renderResultItem(ppl.hierarchy, displayName);
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Tags */}
      <div className="mt-2 flex flex-wrap gap-2">
        {showAllUkraineTag ? (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
            Вся Україна (Default)
          </span>
        ) : (
          selectedLocations.map((loc) => (
            <span
              key={loc}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
            >
              {nameMap[loc] || loc}
              <button
                type="button"
                onClick={() => handleRemoveLocation(loc)}
                className="ml-2 text-indigo-600 hover:bg-indigo-200 hover:text-indigo-800 rounded-full p-0.5"
              >
                <svg className="h-3 w-3" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                  <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                </svg>
              </button>
            </span>
          ))
        )}
      </div>
    </div>
  )
}

export default Locations
