/* eslint-disable @typescript-eslint/no-explicit-any */
import { http, HttpResponse } from 'msw'
import { getDocumentCookie } from '@/lib/common/cookie'


// --- Mock data structures ---
const mockUserProfile = {
  profile: {
    is_hidden: true,
    name: "Жанна",
    photo_w768: "/media/profile-photos/valid-format.webp",
    photo_w540: "/media/CACHE/images/profile-photos/valid-format/48b30af8f559237f115cb97f6b29d6c3.webp",
    photo_w192: "/media/CACHE/images/profile-photos/valid-format/ffdfdd5001b678517d6f10c82650581a.webp",
    photo_w64: "/media/CACHE/images/profile-photos/valid-format/181eccfd1992d4775c37070e9b98e463.webp"
  },
  rent_preferences: {
    min_budget: 2,
    max_budget: 2,
    min_rent_duration_level: 2,
    max_rent_duration_level: 2,
    room_sharing_level: 2,
    locations: {
      regions: [
        {
          hierarchy: "UA09",
          region_name: "Вінницька"
        }
      ],
      cities: [
        {
          hierarchy: "UA0199999001",
          region_name: "Київська",
          ppl_name: "Київ",
          districts: [
            {
              hierarchy: "UA019999900101",
              district_name: "Подільський"
            },
            {
              hierarchy: "UA019999900102",
              district_name: "Швейцарський"
            }
          ]
        },
        {
          hierarchy: "UA0299999001",
          region_name: "Одеська",
          ppl_name: "Кисель",
          districts: []
        }
      ],
      other_ppls: [
        {
          hierarchy: "UA0499999001",
          region_name: "Івано-Франківська",
          subregion_name: "Виноградний",
          ppl_name: "Кишмиш"
        }
      ]
    }
  },
  about: {
    birth_date: "2002-02-20",
    gender: 2,
    is_couple: true,
    has_children: true,
    occupation_type: 2,
    drinking_level: 2,
    smoking_level: 2,
    smokes_iqos: true,
    smokes_vape: true,
    smokes_tobacco: false,
    smokes_cigs: false,
    neighbourliness_level: 2,
    guests_level: 2,
    parties_level: 2,
    bedtime_level: 2,
    neatness_level: 2,
    has_cats: true,
    has_dogs: true,
    has_reptiles: true,
    has_birds: true,
    other_animals: [
      "дракон",
      "равлик"
    ],
    interests: [
      "кіно",
      "плавання"
    ],
    bio: "ХАЛЛО! Написав тут вам трохи про свої захоплення :)))\nГотовий до нових зустрічей!"
  }
}


const mockLocations = {
  regions: [
    {
      hierarchy: "UA01",
      region_name: "Київська"
    }
  ],
  cities: [
    { 
      hierarchy: "UA0199999001", 
      region_name: "Київська", 
      ppl_name: "Київ", 
      districts: [
        {
          hierarchy: "UA019999900101",
          district_name: "Подільський"
        },
        {
          hierarchy: "UA019999900102",
          district_name: "Шевченківський"
        }
      ]
    },
    {
      hierarchy: "UA0299999001",
      region_name: "Одеська",
      ppl_name: "Одеса",
      districts: []
    },
  ],
  other_ppls: [
    {
      hierarchy: "UA0499999001",
      region_name: "Івано-Франківська",
      subregion_name: "Виноградний",
      ppl_name: "Кишмиш"
    }
  ]
}


// --- Mock API handlers ---
const mockApiUrl = '*/api/rest'


const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))


const getMultipartRepresentation = (formData: FormData): Record<string, any> => {
  const repr: Record<string, any> = {}

  for (const [key, value] of formData.entries()) {
    if (repr[key] !== undefined) {
      // Already exists -> convert to array (if not yet)
      if (!Array.isArray(repr[key])) {
        repr[key] = [repr[key]]
      }
      repr[key].push(value)
    }
    else {
      // First occurrence
      repr[key] = value
    }
  }

  return repr
}


export const handlers = [

  // --- Auth ---
  // Login
  http.post(`${mockApiUrl}/auth/login/google/`, async ({ request }) => {
    const body = await request.json()
    const loginBody = body as { code?: string }

    console.log("Mock: Received login request with code (simulated):", loginBody.code)

    await simulateDelay(500)
    return HttpResponse.json({ key: "mock_session_key" }, {
      status: 200,
    })
  }),


  // Logout
  http.post(`${mockApiUrl}/auth/logout/`, async () => {
    console.log("Mock: Received logout request")

    await simulateDelay(300)
    return new HttpResponse(null, { status: 200 })
  }),


  // --- Access ---
  // Profile status
  http.get(`${mockApiUrl}/access/profile-status/`, async ({ cookies }) => {
    console.log("Mock: Received profile status request. Cookies:", cookies)

    await simulateDelay(200)
    return new HttpResponse(null, { status: 404 })
  }),


  // --- Profile ---
  // Read profile
  http.get(`${mockApiUrl}/profile/me/`, async () => {
    console.log("Mock: Received get profile request")

    await simulateDelay(400)
    return HttpResponse.json(mockUserProfile)
  }),


  // Create profile
  http.post(`${mockApiUrl}/profile/me/`, async ({ request }) => {
    console.log("Mock: Received create profile request")

    const formData = await request.formData()
    const formDataRepr = getMultipartRepresentation(formData)
    console.log('Mock: Received profile data:', formDataRepr)

    await simulateDelay(800)
    return new HttpResponse(null, { status: 201 })
  }),


  // Update profile
  http.patch(`${mockApiUrl}/profile/me/`, async ({ request }) => {
    console.log("Mock: Received update profile request")

    const forceApiErrorCookieName = 'shallwe_test_profile_update_force_api_error'
    const forceApiErrorValue = getDocumentCookie(forceApiErrorCookieName)
    console.log(`Mock: cookie '${forceApiErrorCookieName}' is '${forceApiErrorValue}'`)

    if (forceApiErrorValue === 'true') {
      console.log(`Mock: Forcing API Error as per '${forceApiErrorCookieName}' cookie.`);
      return HttpResponse.json(
        {
          error: {
            non_field_errors: ["Forced QA Error (via cookie): Profile update failed due to server issue."],
          }
        },
        { status: 400 }
      )
    }

    const formData = await request.formData()
    const formDataRepr = getMultipartRepresentation(formData)
    console.log('Mock: Received profile data:', formDataRepr)

    await simulateDelay(600)
    return HttpResponse.json(mockUserProfile) // Return "updated" profile data
  }),


  // Update profile visibility
  http.patch(`${mockApiUrl}/profile/visibility/`, async ({ request }) => {
    console.log("Mock: Received update profile visibility request")

    const body = await request.json()
    console.log("Mock: Received visibility data:", body)

    await simulateDelay(300)
    return new HttpResponse(null, { status: 200 })
  }),


  // --- Locations ---
  // Search locations
  http.get(`${mockApiUrl}/locations/search/`, async ({ request }) => {
    console.log("Mock: Received location search request")

    const url = new URL(request.url)
    const query = url.searchParams.get('query')

    console.log("Mock: Search query:", query)

    await simulateDelay(300)

    if (query && query.length >= 2) {
      return HttpResponse.json(mockLocations)
    }
    else {
      return HttpResponse.json({ error: "Query too short" }, { status: 400 })
    }
  }),


  // --- Facecheck ---
  // Check photo for face
  http.post(`${mockApiUrl}/photo/facecheck/`, async ({ request }) => {
    console.log("Mock: Received facecheck request")

    const formData = await request.formData()
    const imageFile = formData.get('image') as File | null

    console.log("Mock: Received image file:", imageFile?.name)

    await simulateDelay(500)
    return HttpResponse.json({ success: true })
  }),


  // --- User ---
  // Delete user
  http.delete(`${mockApiUrl}/auth/user/`, async () => {
    console.log("Mock: Received delete user request")

    await simulateDelay(600)
    return new HttpResponse(null, { status: 204 })
  }),
]
