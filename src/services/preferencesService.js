//localStorage key name
const PREFERENCES_KEY =
  'ageFriendlyAustralia.preferences'

//Valid font size
const TEXT_SIZE_OPTIONS = [
  'standard',
  'large',
  'extra-large',
]

//Return to default preferences
//when use it
//user first visit the web
//not save the preferences
//saved data broken
//user click Clear preferences
function createDefaultPreferences() {
  return {
    generalArea: '',
    interests: [],
    preferredDays: [],
    activityTypes: [],
    textSize: 'standard',
  }
}

//Clean the array
function cleanStringArray(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return [
    ...new Set(
      value
        .map((item) =>
          String(item ?? '').trim(),
        )
        .filter(Boolean),
    ),
  ]
}

//Cleanse complete preference objects
function normalisePreferences(value) {
  const data =
    value &&
    typeof value === 'object'
      ? value
      : {}

  const textSize =
    TEXT_SIZE_OPTIONS.includes(
      data.textSize,
    )
      ? data.textSize
      : 'standard'

  return {
    generalArea: String(
      data.generalArea ?? '',
    ).trim(),

    interests: cleanStringArray(
      data.interests,
    ),

    preferredDays: cleanStringArray(
      data.preferredDays,
    ),

    activityTypes: cleanStringArray(
      data.activityTypes,
    ),

    textSize,
  }
}

// ======================================================
// Notify other components
// ======================================================
//After saving or clearing preferences,
//it dispatches a custom event within the browser window
//Carrying the latest preferences in the event
function notifyPreferencesUpdated(
  preferences,
) {
  if (
    typeof window === 'undefined'
  ) {
    return
  }

  window.dispatchEvent(
    new CustomEvent(
      'age-friendly-preferences-updated',
      {
        detail: preferences,
      },
    ),
  )
}

//Reading preferences
export function getPreferences() {
  try {
    //form the localStorage
    const stored =
      localStorage.getItem(
        PREFERENCES_KEY,
      )

    if (!stored) {
      return createDefaultPreferences()
    }

    return normalisePreferences(
      JSON.parse(stored),
    )
  } catch {
    return createDefaultPreferences()
  }
}

//save Preferences
export function savePreferences(
  preferences,
) {
  const cleanedPreferences =
    normalisePreferences(
      preferences,
    )

  localStorage.setItem(
    PREFERENCES_KEY,
    JSON.stringify(
      cleanedPreferences,
    ),
  )

  //Apply font immediately
  applyTextSizePreference(
    cleanedPreferences.textSize,
  )

  //Send preference update event
  notifyPreferencesUpdated(
    cleanedPreferences,
  )

  return cleanedPreferences
}

//Clear preferences
export function clearPreferences() {
  //remove localStorage
  localStorage.removeItem(
    PREFERENCES_KEY,
  )

  const defaults =
    createDefaultPreferences()

  applyTextSizePreference(
    defaults.textSize,
  )

  //Notify other components
  notifyPreferencesUpdated(
    defaults,
  )

  return defaults
}

//Apply font size
export function applyTextSizePreference(
  value,
) {
  if (
    typeof document === 'undefined'
  ) {
    return
  }

  const textSize =
    TEXT_SIZE_OPTIONS.includes(value)
      ? value
      : 'standard'

  document.documentElement.dataset.textSize =
    textSize
}

//Restore fonts when the website launches
export function applySavedTextSizePreference() {
  const preferences =
    getPreferences()

  applyTextSizePreference(
    preferences.textSize,
  )
}