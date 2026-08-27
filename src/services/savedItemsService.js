const SAVED_ACTIVITY_KEY =
  'ageFriendlyAustralia.savedActivityIds'

function readSavedIds() {
  try {
    const stored = localStorage.getItem(
      SAVED_ACTIVITY_KEY,
    )

    if (!stored) {
      return []
    }

    const parsed = JSON.parse(stored)

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.map(String)
  } catch {
    return []
  }
}

function writeSavedIds(ids) {
  localStorage.setItem(
    SAVED_ACTIVITY_KEY,
    JSON.stringify(ids),
  )
}

export function getSavedActivityIds() {
  return readSavedIds()
}

export function toggleSavedActivityId(id) {
  const activityId = String(id)
  const savedIds = readSavedIds()

  const nextIds = savedIds.includes(activityId)
    ? savedIds.filter(
        (savedId) =>
          savedId !== activityId,
      )
    : [...savedIds, activityId]

  writeSavedIds(nextIds)

  return nextIds
}

export function removeSavedActivityId(id) {
  const activityId = String(id)

  const nextIds = readSavedIds().filter(
    (savedId) =>
      savedId !== activityId,
  )

  writeSavedIds(nextIds)

  return nextIds
}