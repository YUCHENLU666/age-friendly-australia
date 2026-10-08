// ======================================================
// Saved items service
// ======================================================
//
// This service manages saved activity and service IDs
// using browser localStorage.
//
// Main responsibilities:
//
// 1. Read saved activity and service IDs.
// 2. Save updated IDs back to localStorage.
// 3. Add / remove IDs through toggle operations.
// 4. Clean and normalise stored IDs.
// 5. Migrate activity saves created by an older version
//    of the application.
//
// Main data flow:
//
// ActivityCard / ServiceCard
//   ↓
// parent view
//   ↓
// savedItemsService
//   ↓
// localStorage
//   ↓
// SavedView / CalendarView
//
// Only IDs are stored here.
//
// Full activity and service objects are loaded separately
// from their corresponding data services.
//


// ======================================================
// Local storage keys
// ======================================================

// Current storage key.
//
// One object is used to store both activity IDs
// and service IDs.
const SAVED_ITEMS_KEY =
  'ageFriendlyAustralia.savedItems'

// Storage key used by an earlier version of the app.
//
// Existing activity saves stored under this key are
// automatically migrated to SAVED_ITEMS_KEY.
const LEGACY_ACTIVITY_KEY =
  'ageFriendlyAustralia.savedActivityIds'


// ======================================================
// Default saved-items structure
// ======================================================

/**
 * Create an empty saved-items object.
 *
 * Keeping one consistent structure simplifies storage
 * handling across Activities, Services, Saved and Calendar.
 */
function createDefaultSavedItems() {
  return {
    activityIds: [],
    serviceIds: [],
  }
}


// ======================================================
// ID normalisation
// ======================================================

/**
 * Clean and normalise an array of saved IDs.
 *
 * All IDs are converted to trimmed strings.
 *
 * Invalid / empty values are removed and duplicates are
 * removed using Set.
 *
 * Example:
 *
 * [1, 2, '3', null, undefined, '']
 *
 * becomes:
 *
 * ['1', '2', '3']
 */
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


// ======================================================
// Write saved items
// ======================================================

/**
 * Convert the saved-items object to JSON and store it
 * under the current localStorage key.
 */
function writeSavedItems(savedItems) {
  localStorage.setItem(
    SAVED_ITEMS_KEY,
    JSON.stringify(savedItems),
  )
}


// ======================================================
// Read saved items
// ======================================================

/**
 * Read saved activity and service IDs from localStorage.
 *
 * The returned object always follows this structure:
 *
 * {
 *   activityIds: [],
 *   serviceIds: []
 * }
 *
 * Stored IDs are cleaned before being returned.
 *
 * If current saved-item data does not exist, the function
 * also checks for activity saves created by the earlier
 * version of the application and migrates them.
 */
function readSavedItems() {
  try {
    const stored =
      localStorage.getItem(
        SAVED_ITEMS_KEY,
      )

    // Current saved-items format.
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

    // ==================================================
    // Legacy activity-save migration
    // ==================================================
    //
    // Earlier versions stored only activity IDs under a
    // separate localStorage key.
    //
    // When legacy data is found:
    //
    // 1. Convert it to the current saved-items structure.
    // 2. Save the migrated structure.
    // 3. Remove the old localStorage entry.
    //
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
    // Corrupted or invalid localStorage data should not
    // prevent the rest of the application from loading.
    console.error(
      'Unable to read saved items.',
      error,
    )
  }

  return createDefaultSavedItems()
}


// ======================================================
// Generic ID toggle
// ======================================================

/**
 * Toggle one ID inside an array.
 *
 * If the ID already exists:
 *   remove it.
 *
 * If the ID does not exist:
 *   add it.
 *
 * IDs are stored as strings for consistency.
 */
function toggleId(
  ids,
  id,
) {
  const itemId =
    String(id)

  // Unsave existing item.
  if (ids.includes(itemId)) {
    return ids.filter(
      (savedId) =>
        savedId !== itemId,
    )
  }

  // Save new item.
  return [
    ...ids,
    itemId,
  ]
}


// ======================================================
// Read saved IDs
// ======================================================

/**
 * Return the complete saved-items object.
 */
export function getSavedItems() {
  return readSavedItems()
}


/**
 * Return only saved activity IDs.
 *
 * Used by features such as:
 *
 * - ActivitiesView
 * - SavedView
 * - CalendarView
 */
export function getSavedActivityIds() {
  return readSavedItems()
    .activityIds
}


/**
 * Return only saved service IDs.
 *
 * Used by features such as:
 *
 * - Services views
 * - SavedView
 * - CalendarView
 */
export function getSavedServiceIds() {
  return readSavedItems()
    .serviceIds
}


// ======================================================
// Toggle saved activity
// ======================================================

/**
 * Save or unsave one activity ID.
 *
 * Flow:
 *
 * read current saved items
 *   ↓
 * toggle activity ID
 *   ↓
 * write updated saved items
 *   ↓
 * return updated activity IDs
 */
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


// ======================================================
// Toggle saved service
// ======================================================

/**
 * Save or unsave one service ID.
 *
 * Uses the same shared saved-items object as activities.
 */
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


// ======================================================
// Remove saved activity
// ======================================================

/**
 * Remove one activity ID without using toggle behaviour.
 *
 * This is useful when a caller explicitly needs to remove
 * a saved activity regardless of its current state.
 */
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


// ======================================================
// Remove saved service
// ======================================================

/**
 * Remove one service ID without using toggle behaviour.
 */
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