import React, { useState, useEffect, useCallback, useRef } from 'react'
import { searchLocations } from '@/lib/shallwe/locations/api/calls'
import { LocationsReadFields, GenericLocationReadFields } from '@/lib/shallwe/locations/api/schema'
import { ApiError } from '@/lib/shallwe/common/api/calls'
import { Input } from '@/components/ui/input'
import { MetaPill } from '@/components/ui/meta-pill'
import { cn } from '@/lib/utils'

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
      onClick={() => handleSelectLocation(hierarchy, displayName)}
      className={cn(
        'cursor-pointer rounded-md px-3 py-2 text-sm transition',
        selectedLocations.includes(hierarchy)
          ? 'bg-primary/10 text-primary hover:bg-primary/20'
          : 'text-foreground hover:bg-muted/30',
        selectedLocations.length >= MAX_LOCATIONS && !selectedLocations.includes(hierarchy) && 'cursor-not-allowed opacity-50'
      )}
    >
      {displayName}
    </div>
  );

  const searchInputClasses = cn(
    isInputFrozen && 'border-destructive bg-destructive/5 text-destructive cursor-not-allowed',
    searchError && 'border-destructive focus-visible:ring-destructive',
    !isInputFrozen && !searchError && 'border-border'
  )

  return (
    <div className="relative space-y-3" ref={wrapperRef}>
      {/* Search field */}
      <div className="relative">
        <Input
          id="location-search"
          value={searchQuery}
          onChange={(e) => {
            if (!isInputFrozen) {
              setSearchQuery(e.target.value)
            }
          }}
          placeholder="Enter location..."
          onFocus={() => {
            if (selectedLocations.length >= MAX_LOCATIONS) {
              setIsInputFrozen(true)
              setIsCounterSwinging(true)
              setTimeout(() => setIsCounterSwinging(false), 500)
            } else if (searchResults) {
              setShowResults(true)
            }
          }}
          className={searchInputClasses}
          disabled={isInputFrozen}
        />
        {isLoading && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          </div>
        )}
      </div>

      {searchError && <p className="text-sm text-muted">{searchError}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Location Counter */}
      <div className="flex items-center justify-between text-sm text-subtle">
        <span className={cn('inline-block transition-colors', isCounterSwinging && 'animate-pulse text-destructive')}>
          {selectedLocations.length}/{MAX_LOCATIONS} locations picked
        </span>
        {selectedLocations.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onLocationsChange([])
              setNameMap({})
              setIsInputFrozen(false)
              setIsCounterSwinging(false)
            }}
            className="text-xs font-medium text-muted underline-offset-2 hover:text-foreground"
          >
            clear all &times;
          </button>
        )}
      </div>

      {/* Search Results Dropdown (absolute overlay) */}
      {showResults && searchResults && (
        <div
          className="absolute left-0 right-0 z-50 max-h-60 overflow-y-auto rounded-lg border border-border bg-card shadow-[var(--shadow-soft)]"
        >
          {/* Regions */}
          {searchResults.regions && searchResults.regions.length > 0 && (
            <div className="p-3 space-y-1">
              <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted">Regions</h3>
              {searchResults.regions.map((region) => {
                const displayName = getDisplayName(region, 'region')
                return renderResultItem(region.hierarchy, displayName)
              })}
            </div>
          )}
          {/* Cities */}
          {searchResults.cities && searchResults.cities.length > 0 && (
            <div className="space-y-1 p-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted">Cities</h3>
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
            <div className="space-y-1 p-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-wide text-muted">Other</h3>
              {searchResults.other_ppls.map((ppl) => {
                const displayName = getDisplayName(ppl, 'other_ppl');
                return renderResultItem(ppl.hierarchy, displayName);
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2">
        {showAllUkraineTag
          ? (
            <MetaPill className="normal-case text-xs font-medium tracking-normal">
              Вся Україна (Default)
            </MetaPill>
            )
          : selectedLocations.map((loc) => (
              <MetaPill key={loc} className="normal-case text-xs font-medium tracking-normal">
                {nameMap[loc] || loc}
                <button
                  type="button"
                  onClick={() => handleRemoveLocation(loc)}
                  className="ml-1 text-muted transition hover:text-destructive"
                  aria-label={`Remove ${nameMap[loc] || loc}`}
                >
                  &times;
                </button>
              </MetaPill>
            ))}
      </div>
    </div>
  )
}

export default Locations
