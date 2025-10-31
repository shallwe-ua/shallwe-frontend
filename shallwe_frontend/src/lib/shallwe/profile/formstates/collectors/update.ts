import { LocationsReadFields } from "@/lib/shallwe/locations/api/schema";
import { ProfileReadData } from "../../api/schema/read";
import { ProfileUpdateData } from "../../api/schema/update";
import { ProfileUpdateFormState } from "../states";

// Helper function to convert LocationsReadFields object to an array of hierarchy strings
export const extractHierarchyStrings = (locationsObject: LocationsReadFields): string[] => {
  const hierarchies: string[] = [];
  if (locationsObject.regions) {
    hierarchies.push(...locationsObject.regions.map(r => r.hierarchy));
  }
  if (locationsObject.cities) {
    locationsObject.cities.forEach(c => {
      const districtHierarchies = c.districts?.map(d => d.hierarchy) || [];
      if (districtHierarchies.length > 0) {
        // Rule: If a city has selected districts, only add the district hierarchies
        hierarchies.push(...districtHierarchies);
      } else {
        // Rule: If a city has no selected districts, add the city's own hierarchy
        hierarchies.push(c.hierarchy);
      }
    });
  }
  if (locationsObject.other_ppls) {
    hierarchies.push(...locationsObject.other_ppls.map(op => op.hierarchy));
  }
  return hierarchies;
};

// Helper function to compare two simple values (primitives, arrays of primitives, null/undefined)
function valuesAreEqual(value1: any, value2: any): boolean {
  if (value1 === value2) return true;
  if (value1 == null && value2 == null) return true; // Handles both being null
  if (Array.isArray(value1) && Array.isArray(value2)) {
    if (value1.length !== value2.length) return false;
    for (let i = 0; i < value1.length; i++) {
      if (value1[i] !== value2[i]) return false;
    }
    return true;
  }
  return false;
}

// This function compares the editFormState with the initialProfileData to collect only changed values
export function collectProfileUpdateDataFromState(
  formState: ProfileUpdateFormState,
  initialProfileData: ProfileReadData
): ProfileUpdateData {
  const updatePayload: ProfileUpdateData = {};

  // --- Profile Section ---
  const updateProfile: Partial<ProfileUpdateData['profile']> = {};

  // Handle name: compare, if changed, assign the state value (which is string).
  if (formState.profile.name !== initialProfileData.profile.name) {
    updateProfile.name = formState.profile.name; // Assigns string
  }

  // Handle photo: File object means change, assign it. Null means no change intended, omit.
  if (formState.profile.photo instanceof File) {
    updateProfile.photo = formState.profile.photo; // Include the new File
  }

  if (Object.keys(updateProfile).length > 0) {
    updatePayload.profile = updateProfile;
  }

  // --- About Section ---
  const updateAbout: Partial<ProfileUpdateData['about']> = {};

  // Handle all fields in about section
  for (const key of Object.keys(formState.about) as (keyof ProfileUpdateFormState['about'])[]) {
    const stateValue = formState.about[key];
    const initialValue = (initialProfileData.about as any)[key];

    if (!valuesAreEqual(stateValue, initialValue)) {
      // For fields that are T | null in state (like bio, levels), assign directly.
      // For fields that are T (like booleans, numbers) in state, assign directly.
      // The payload type will determine if null is allowed or not at the API level.
      (updateAbout as any)[key] = stateValue;
    }
  }

  if (Object.keys(updateAbout).length > 0) {
    updatePayload.about = updateAbout;
  }

  // --- Rent Preferences Section ---
  const updateRentPrefs: Partial<ProfileUpdateData['rent_preferences']> = {};

  // Handle all fields in rent_preferences section
  for (const key of Object.keys(formState.rent_preferences) as (keyof ProfileUpdateFormState['rent_preferences'])[]) {
    if (key === 'locations') {
      // Compare locations array (converted from initial object)
      const initialLocationsArray = extractHierarchyStrings(initialProfileData.rent_preferences.locations);
      if (!valuesAreEqual(formState.rent_preferences.locations, initialLocationsArray)) {
        updateRentPrefs.locations = formState.rent_preferences.locations; // Assigns string[]
      }
    } else {
      // Compare other fields (numbers)
      const stateValue = formState.rent_preferences[key];
      const initialValue = (initialProfileData.rent_preferences as any)[key];

      if (!valuesAreEqual(stateValue, initialValue)) {
        (updateRentPrefs as any)[key] = stateValue; // Assigns number
      }
    }
  }

  if (Object.keys(updateRentPrefs).length > 0) {
    updatePayload.rent_preferences = updateRentPrefs;
  }

  return updatePayload;
}