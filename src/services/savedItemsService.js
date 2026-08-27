const SAVED_ITEMS_KEY =
  'ageFriendlyAustralia.savedItems'

const LEGACY_ACTIVITY_KEY =
  'ageFriendlyAustralia.savedActivityIds'

function createDefaultSavedItems() {
  return {
    activityIds: [],
    serviceIds: [],
  }
}

function cleanIds(value) {
  if (!Array.isArray(value)) {
    return []
  }

  return [
    ...new Set(
      value
        .map((id) =>
          String(id ?? '').trim(),
        )
        .filter(Boolean),
    ),
  ]
}

function writeSavedItems(savedItems) {
  localStorage.setItem(
    SAVED_ITEMS_KEY,
    JSON.stringify(savedItems),
  )
}

function readSavedItems() {
  try {
    const stored =
      localStorage.getItem(
        SAVED_ITEMS_KEY,
      )

    if (stored) {
      const parsed =
        JSON.parse(stored)

      return {
        activityIds:
          cleanIds(
            parsed.activityIds,
          ),

        serviceIds:
          cleanIds(
            parsed.serviceIds,
          ),
      }
    }

    /*
     * Migrate activity saves created
     * by the earlier version.
     */
    const legacyActivities =
      localStorage.getItem(
        LEGACY_ACTIVITY_KEY,
      )

    if (legacyActivities) {
      const migrated = {
        activityIds:
          cleanIds(
            JSON.parse(
              legacyActivities,
            ),
          ),

        serviceIds: [],
      }

      writeSavedItems(
        migrated,
      )

      localStorage.removeItem(
        LEGACY_ACTIVITY_KEY,
      )

      return migrated
    }
  } catch (error) {
    console.error(
      'Unable to read saved items.',
      error,
    )
  }

  return createDefaultSavedItems()
}

function toggleId(
  ids,
  id,
) {
  const itemId =
    String(id)

  if (ids.includes(itemId)) {
    return ids.filter(
      (savedId) =>
        savedId !== itemId,
    )
  }

  return [
    ...ids,
    itemId,
  ]
}

export function getSavedItems() {
  return readSavedItems()
}

export function getSavedActivityIds() {
  return readSavedItems()
    .activityIds
}

export function getSavedServiceIds() {
  return readSavedItems()
    .serviceIds
}

export function toggleSavedActivityId(
  id,
) {
  const savedItems =
    readSavedItems()

  savedItems.activityIds =
    toggleId(
      savedItems.activityIds,
      id,
    )

  writeSavedItems(
    savedItems,
  )

  return savedItems.activityIds
}

export function toggleSavedServiceId(
  id,
) {
  const savedItems =
    readSavedItems()

  savedItems.serviceIds =
    toggleId(
      savedItems.serviceIds,
      id,
    )

  writeSavedItems(
    savedItems,
  )

  return savedItems.serviceIds
}

export function removeSavedActivityId(
  id,
) {
  const savedItems =
    readSavedItems()

  savedItems.activityIds =
    savedItems.activityIds.filter(
      (savedId) =>
        savedId !== String(id),
    )

  writeSavedItems(
    savedItems,
  )

  return savedItems.activityIds
}

export function removeSavedServiceId(
  id,
) {
  const savedItems =
    readSavedItems()

  savedItems.serviceIds =
    savedItems.serviceIds.filter(
      (savedId) =>
        savedId !== String(id),
    )

  writeSavedItems(
    savedItems,
  )

  return savedItems.serviceIds
}