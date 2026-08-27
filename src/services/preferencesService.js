const PREFERENCES_KEY =
  'ageFriendlyAustralia.preferences'

const TEXT_SIZE_OPTIONS = [
  'standard',
  'large',
  'extra-large',
]

function createDefaultPreferences() {
  return {
    generalArea: '',
    interests: [],
    preferredDays: [],
    activityTypes: [],
    textSize: 'standard',
  }
}

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

export function savePreferences(
  preferences,
) {
  const cleanedPreferences =
    normalisePreferences(preferences)

  localStorage.setItem(
    PREFERENCES_KEY,
    JSON.stringify(
      cleanedPreferences,
    ),
  )

  applyTextSizePreference(
    cleanedPreferences.textSize,
  )

  return cleanedPreferences
}

export function clearPreferences() {
  localStorage.removeItem(
    PREFERENCES_KEY,
  )

  const defaults =
    createDefaultPreferences()

  applyTextSizePreference(
    defaults.textSize,
  )

  return defaults
}

export function applyTextSizePreference(
  value,
) {
  if (
    typeof document ===
    'undefined'
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

export function applySavedTextSizePreference() {
  const preferences =
    getPreferences()

  applyTextSizePreference(
    preferences.textSize,
  )
}