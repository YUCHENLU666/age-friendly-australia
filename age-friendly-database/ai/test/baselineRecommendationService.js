// age-friendly-database/ai/test/baselineRecommendationService.js
// Score activities with fixed area, interest, and day rules for comparison.
//
// How calls move:
// baselineRecommendActivities -> normaliseText/getActivityDay -> area, category and day points -> sort and slice.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//   vector / embedding: a list of numbers for the meaning of text.
//   hash: a text check code; changed text gets a different code.
//
// Functions:
//   normaliseText - Remove end spaces and use lowercase letters.
//   getActivityDay - Read a date and return its weekday name.
//   baselineRecommendActivities - Add 4 points for area, 3 for category interest, and 2 for weekday; return
//   top results.
//
// Fixed values and data:
//   DAY_NAMES - Weekday names; index 0 is Sunday and index 1 is Monday.
//
// Notes:
//   This method uses rules only. It does not use vectors or score activityTypes.

// Weekday names; index 0 is Sunday and index 1 is Monday.
const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

// Remove end spaces and use lowercase letters.
// Example input: ' Clayton '
// Example result: 'clayton'.
function normaliseText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

// Read a date and return its weekday name.
// Example input: '2026-10-08 10:00:00'
// Example result: 'Thursday'; 'bad date' gives ''.
function getActivityDay(
  dateTime,
) {
  if (!dateTime) {
    return ''
  }

  const date =
    new Date(
      String(dateTime).replace(
        ' ',
        'T',
      ),
    )

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return ''
  }

  return DAY_NAMES[
    date.getDay()
  ]
}

// Add 4 points for area, 3 for category interest, and 2 for weekday; return top results.
// Example input: preferences={generalArea:'Clayton', interests:[], preferredDays:[]},
// activities=[{id:1,suburb:'Clayton'}], limit=1
// Example result: one result with activityId:1 and score:4.
function baselineRecommendActivities(
  preferences = {},
  activities = [],
  limit = 3,
) {
  if (!Array.isArray(activities)) {
    return []
  }

  return activities
    .map((activity) => {
      let score = 0
      const reasons = []

      const activityCategory =
        normaliseText(
          activity.category_tags,
        )

      const activityDay =
        getActivityDay(
          activity.day_time,
        )

      const areaMatch =
        Boolean(
          preferences.generalArea,
        ) &&
        normaliseText(
          activity.suburb,
        ) ===
          normaliseText(
            preferences.generalArea,
          )

      if (areaMatch) {
        score += 4

        reasons.push(
          'Area matches',
        )
      }

      const interestMatch =
        Array.isArray(
          preferences.interests,
        ) &&
        preferences.interests.some(
          (interest) =>
            activityCategory.includes(
              normaliseText(
                interest,
              ),
            ),
        )

      if (interestMatch) {
        score += 3

        reasons.push(
          'Category matches an interest',
        )
      }

      const dayMatch =
        Array.isArray(
          preferences.preferredDays,
        ) &&
        preferences.preferredDays.some(
          (day) =>
            normaliseText(day) ===
            normaliseText(
              activityDay,
            ),
        )

      if (dayMatch) {
        score += 2

        reasons.push(
          'Day matches',
        )
      }

      return {
        activityId:
          activity.id,

        activity,

        score,

        reasons,
      }
    })
    .sort(
      (a, b) =>
        b.score - a.score,
    )
    .slice(0, limit)
}

module.exports = {
  baselineRecommendActivities,
}
