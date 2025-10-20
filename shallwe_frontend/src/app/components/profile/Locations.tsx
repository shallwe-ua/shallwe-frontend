import React, { useState, useEffect, useCallback, useRef } from 'react'
import { searchLocations } from '@/lib/shallwe/locations/api/calls'
import { LocationsReadFields } from '@/lib/shallwe/locations/api/schema'

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
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<LocationsReadFields | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  const [nameMap, setNameMap] = useState<Record<string, string>>({})

  const wrapperRef = useRef<HTMLDivElement>(null)

  // 🧠 Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const areOverlappingHierarchies = (h1: string, h2: string) => {
    return h1.startsWith(h2) || h2.startsWith(h1)
  }

  const handleSelectLocation = (selectedHierarchy: string, displayName: string) => {
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
  }

  const handleRemoveLocation = (hierarchyToRemove: string) => {
    onClearError()
    const newLocations = selectedLocations.filter((h) => h !== hierarchyToRemove)
    onLocationsChange(newLocations)
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
          setSearchError('Failed to search locations. Please try again.')
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

  const getDisplayName = (entity: any, type: 'region' | 'city' | 'other_ppl' | 'district', parentCity?: { ppl_name: string }) => {
    switch (type) {
      case 'region':
        return entity.region_name;
      case 'city':
        // Big cities: City Name (Region Name)
        return `${entity.ppl_name} (${entity.region_name})`;
      case 'district':
        // Districts: City Name, District Name (e.g., Київ, Подільский)
        // parentCity is expected for districts
        return parentCity ? `${parentCity.ppl_name}, ${entity.district_name}` : entity.district_name;
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
      }`}
    >
      {displayName}
    </div>
  );

  return (
    <div className="space-y-2 relative" ref={wrapperRef}>
      {searchError && <p className="mt-1 text-sm text-red-600">{searchError}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {/* Search field */}
      <div className="relative">
        <input
          type="text"
          id="location-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Enter location..."
          onFocus={() => searchResults && setShowResults(true)}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            searchError ? 'border-red-500' : ''
          }`}
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
          </div>
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
