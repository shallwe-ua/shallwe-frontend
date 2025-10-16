import { ProfileCreateData } from "./create"


// Same as create, but all optional
// (cherry-pick changes allowed, except required combinations - checked during validation)
export interface ProfileUpdateData {
  profile?: Partial<ProfileCreateData['profile']>
  about?: Partial<ProfileCreateData['about']>
  rent_preferences?: Partial<ProfileCreateData['rent_preferences']>
}
