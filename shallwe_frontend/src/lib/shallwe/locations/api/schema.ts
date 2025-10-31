interface RegionReadFields {
  hierarchy: string
  region_name: string
}


interface CityReadFields {
  hierarchy: string
  region_name: string
  ppl_name: string
  districts: DistrictReadFields[]
}


interface DistrictReadFields {
  hierarchy: string
  district_name: string
}


interface OtherPplReadFields {
  hierarchy: string
  region_name: string
  subregion_name: string
  ppl_name: string
}


export interface GenericLocationReadFields {  // For iterating over different types of locations
  hierarchy: string
  region_name?: string
  subregion_name?: string
  ppl_name?: string
  district_name?: string
  districts?: DistrictReadFields[]
}


export interface LocationsReadFields {
  regions: RegionReadFields[]
  cities: CityReadFields[]
  other_ppls: OtherPplReadFields[]
}


export const emptyLocationsReadData: LocationsReadFields = {
  regions: [],
  cities: [],
  other_ppls: []
}
