const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

function normaliseText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

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
