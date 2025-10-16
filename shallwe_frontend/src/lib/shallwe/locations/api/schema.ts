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


export interface LocationsReadFields {
  regions: RegionReadFields[]
  cities: CityReadFields[]
  other_ppls: OtherPplReadFields[]
}
