//create a service to manage saved items id in local storage
const SAVED_ITEMS_KEY =
  'ageFriendlyAustralia.savedItems'

//used to store the savedActivityIds in last version of the website, now migrated to SAVED_ITEMS_KEY
const LEGACY_ACTIVITY_KEY =
  'ageFriendlyAustralia.savedActivityIds'

// create a default saved items object with empty arrays for activityIds and serviceIds
function createDefaultSavedItems() {
  return {
    activityIds: [],
    serviceIds: [],
  }
}

// Clean and normalise an array of IDs, removing duplicates and invalid values
// for example, if the input is [1, 2, '3', null, undefined, ''], the output will be ['1', '2', '3']
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

// convert the saved items object to a JSON string and store it in local storage under the SAVED_ITEMS_KEY
function writeSavedItems(savedItems) {
  localStorage.setItem(
    SAVED_ITEMS_KEY,
    JSON.stringify(savedItems),
  )
}

// read the saved items from local storage, parse the JSON string, and return a cleaned and normalised object with activityIds and serviceIds
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

// Toggle an ID in an array of IDs. If the ID is already present, it will be removed; if it is not present, it will be added.
function toggleId(
  ids,
  id,
) {
  const itemId =
    String(id)
  //unsave
  if (ids.includes(itemId)) {
    return ids.filter(
      (savedId) =>
        savedId !== itemId,
    )
  }
  //save
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

// Toggle an activity ID in the saved items. If the ID is already present, it will be removed; if it is not present, it will be added.
//read the current savedItems -> toggle activityIds -> write the updated savedItems back to local storage -> return the updated activityIds
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

//One-click removal in the future, not used in the current version of the website, but can be used in the future to remove a saved activity or service ID from local storage.
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