// src/services/preferencesService.js
// Read, clean, save, and clear choices; set page text size.
//
// How calls move:
// PreferencesView.save/reset -> normalisePreferences -> localStorage -> applyTextSizePreference -> preference update event.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//
// Functions:
//   createDefaultPreferences - Return the starting choices and standard text size.
//   cleanStringArray - Trim each item, remove empty items, and remove repeats.
//   normalisePreferences - Clean the choices and use standard text size for an unknown size.
//   notifyPreferencesUpdated - Send a browser event so pages that listen can read the new choices.
//   getPreferences - Read saved choices; return starting choices when missing or unreadable.
//   savePreferences - Clean and save choices, apply text size, and send an update event.
//   clearPreferences - Remove saved choices and apply the starting choices.
//   applyTextSizePreference - Set the HTML text-size value used by CSS.
//   applySavedTextSizePreference - Read the saved text size and apply it when the app starts.
//
// Fixed values and data:
//   PREFERENCES_KEY - localStorage name for the saved preference object.
//   TEXT_SIZE_OPTIONS - Allowed text-size values: standard, large, extra-large.
//
// Notes:
//   Saving choices does not call the backend or ask AI for results.
//   Only four activity-choice fields are sent to AI; textSize is not sent.

// localStorage name for the saved preference object.
const PREFERENCES_KEY =
  'ageFriendlyAustralia.preferences'

// Allowed text-size values: standard, large, extra-large.
const TEXT_SIZE_OPTIONS = [
  'standard',
  'large',
  'extra-large',
]

// Return the starting choices and standard text size.
// Example input: no arguments
// Example result: {generalArea:'', interests:[], preferredDays:[], activityTypes:[], textSize:'standard'}.
function createDefaultPreferences() {
  return {
    generalArea: '',
    interests: [],
    preferredDays: [],
    activityTypes: [],
    textSize: 'standard',
  }
}

// Trim each item, remove empty items, and remove repeats.
// Example input: [' Music ', '', 'Music', null]
// Example result: ['Music'].
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

// Clean the choices and use standard text size for an unknown size.
// Example input: {generalArea:' Clayton ', interests:[' Music ', 'Music'], textSize:'huge'}
// Example result: generalArea:'Clayton', interests:['Music'], preferredDays:[], activityTypes:[],
// textSize:'standard'.
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

// Send a browser event so pages that listen can read the new choices.
// Example input: preferences={textSize:'large'}
// Example result: sends 'age-friendly-preferences-updated' with detail={textSize:'large'}; returns no value.
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

// Read saved choices; return starting choices when missing or unreadable.
// Example input: localStorage has no preferences
// Example result: starting object with empty choices and textSize:'standard'.
export function getPreferences() {
  try {
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

// Clean and save choices, apply text size, and send an update event.
// Example input: {generalArea:' Clayton ', interests:['Music'], textSize:'large'}
// Example result: returns the cleaned full object, saves it, and sets the page text size to large.
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

  applyTextSizePreference(
    cleanedPreferences.textSize,
  )

  notifyPreferencesUpdated(
    cleanedPreferences,
  )

  return cleanedPreferences
}

// Remove saved choices and apply the starting choices.
// Example input: saved interests=['Music'], textSize='large'; call with no arguments
// Example result: returns empty choices with textSize:'standard'; removes storage and updates page text size.
export function clearPreferences() {
  localStorage.removeItem(
    PREFERENCES_KEY,
  )

  const defaults =
    createDefaultPreferences()

  applyTextSizePreference(
    defaults.textSize,
  )

  notifyPreferencesUpdated(
    defaults,
  )

  return defaults
}

// Set the HTML text-size value used by CSS.
// Example input: 'large'
// Example result: html.dataset.textSize becomes 'large'; unknown value uses 'standard'. Returns no value.
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

// Read the saved text size and apply it when the app starts.
// Example input: stored textSize='extra-large'
// Example result: html.dataset.textSize becomes 'extra-large'; returns no value.
export function applySavedTextSizePreference() {
  const preferences =
    getPreferences()

  applyTextSizePreference(
    preferences.textSize,
  )
}