// src/services/savedItemsService.js
// Save activity and service IDs in this browser.
//
// How calls move:
// Toggle/remove -> readSavedItems -> cleanIds -> update ID array -> writeSavedItems -> return updated IDs.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//
// Functions:
//   createDefaultSavedItems - Return empty lists for saved activity and service IDs.
//   cleanIds - Turn IDs into text, remove spaces, empty IDs, and repeats.
//   writeSavedItems - Save the full saved-item object as JSON in localStorage.
//   readSavedItems - Read saved IDs; clean them or use empty lists if reading fails.
//   toggleId - Return a new list with this ID added or removed.
//   getSavedItems - Read the full saved-item object.
//   getSavedActivityIds - Read only the saved activity IDs.
//   getSavedServiceIds - Read only the saved service IDs.
//   toggleSavedActivityId - Add or remove an activity ID, save the object, and return activity IDs.
//   toggleSavedServiceId - Add or remove a service ID, save the object, and return service IDs.
//   removeSavedActivityId - Remove an activity ID, save the object, and return the IDs left.
//   removeSavedServiceId - Remove a service ID, save the object, and return the IDs left.
//
// Fixed values and data:
//   SAVED_ITEMS_KEY - localStorage name for the saved activity and service IDs.
//   LEGACY_ACTIVITY_KEY - Old localStorage name that held only saved activity IDs.
//
// Notes:
//   Only IDs are stored; the full service or activity is loaded separately.
//   Saves stay in this browser and are not shared across devices.

// localStorage name for the saved activity and service IDs.
const SAVED_ITEMS_KEY =
  'ageFriendlyAustralia.savedItems'

// Old localStorage name that held only saved activity IDs.
const LEGACY_ACTIVITY_KEY =
  'ageFriendlyAustralia.savedActivityIds'

// Return empty lists for saved activity and service IDs.
// Example input: no arguments
// Example result: {activityIds:[], serviceIds:[]}.
function createDefaultSavedItems() {
  return {
    activityIds: [],
    serviceIds: [],
  }
}

// Turn IDs into text, remove spaces, empty IDs, and repeats.
// Example input: [1, ' 2 ', 1, null, '']
// Example result: ['1', '2'].
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

// Save the full saved-item object as JSON in localStorage.
// Example input: {activityIds:['1'], serviceIds:['7']}
// Example result: localStorage stores that object as JSON; returns no value.
function writeSavedItems(savedItems) {
  localStorage.setItem(
    SAVED_ITEMS_KEY,
    JSON.stringify(savedItems),
  )
}

// Read saved IDs; clean them or use empty lists if reading fails.
// Example input: localStorage has no saved IDs
// Example result: {activityIds:[], serviceIds:[]}; old activity IDs are moved to the new key.
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

    const legacyActivities =
      localStorage.getItem(
        LEGACY_ACTIVITY_KEY,
      )

    // Move old activity saves to the current storage format.
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

// Return a new list with this ID added or removed.
// Example input: ids=['1'], id=2
// Example result: ['1', '2']; ids=['1', '2'], id=2 gives ['1'].
function toggleId(
  ids,
  id,
) {
  const itemId =
    String(id)
  // Remove an ID already saved; otherwise add it.
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

// Read the full saved-item object.
// Example input: localStorage has activityIds=['1'], serviceIds=['7']
// Example result: {activityIds:['1'], serviceIds:['7']}.
export function getSavedItems() {
  return readSavedItems()
}

// Read only the saved activity IDs.
// Example input: stored activityIds=['1'], serviceIds=['7']
// Example result: ['1'].
export function getSavedActivityIds() {
  return readSavedItems()
    .activityIds
}

// Read only the saved service IDs.
// Example input: stored activityIds=['1'], serviceIds=['7']
// Example result: ['7'].
export function getSavedServiceIds() {
  return readSavedItems()
    .serviceIds
}

// Add or remove an activity ID, save the object, and return activity IDs.
// Example input: id=1, stored activityIds=[]
// Example result: returns ['1'] and saves it; serviceIds do not change.
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

// Add or remove a service ID, save the object, and return service IDs.
// Example input: id=7, stored serviceIds=[]
// Example result: returns ['7'] and saves it; activityIds do not change.
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

// Remove an activity ID, save the object, and return the IDs left.
// Example input: id=1, stored activityIds=['1', '2']
// Example result: ['2'], also saved in localStorage.
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

// Remove a service ID, save the object, and return the IDs left.
// Example input: id=7, stored serviceIds=['7', '8']
// Example result: ['8'], also saved in localStorage.
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