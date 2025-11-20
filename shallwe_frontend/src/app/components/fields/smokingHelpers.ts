type SmokingAboutState = {
  smoking_level: number | null
  smokes_iqos?: boolean | null
  smokes_vape?: boolean | null
  smokes_tobacco?: boolean | null
  smokes_cigs?: boolean | null
}

export const applySmokingLevelReset = <T extends SmokingAboutState>(about: T, newLevel: T['smoking_level']): T => {
  const updated = { ...about, smoking_level: newLevel }

  if (newLevel === null || newLevel === 1) {
    updated.smokes_iqos = false
    updated.smokes_vape = false
    updated.smokes_tobacco = false
    updated.smokes_cigs = false
  }

  return updated
}

export const hasSmokingTypeSelected = (about: SmokingAboutState): boolean =>
  Boolean(about.smokes_iqos || about.smokes_vape || about.smokes_tobacco || about.smokes_cigs)

export const ensureSmokingLevelBeforeTypes = (
  about: SmokingAboutState,
  errorsMap: Record<string, string>,
  errorKey = 'about.smoking_level'
): boolean => {
  const missingLevel = about.smoking_level === null || about.smoking_level === undefined

  if (hasSmokingTypeSelected(about) && missingLevel) {
    errorsMap[errorKey] = 'Select a smoking level before choosing smoking types.'
    return false
  }

  return true
}
