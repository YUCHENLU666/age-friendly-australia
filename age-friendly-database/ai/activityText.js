function cleanText(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(
      /&#39;|&apos;/gi,
      "'",
    )
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildActivityText(
  activity,
) {
  const name =
    cleanText(
      activity.event_name ??
        activity.name,
    )

  const category =
    cleanText(
      activity.category_tags ??
        activity.category,
    )

  const description =
    cleanText(
      activity.description,
    )

  return [
    name
      ? `Activity: ${name}.`
      : '',

    category
      ? `Category: ${category}.`
      : '',

    description
      ? `Description: ${description}`
      : '',
  ]
    .filter(Boolean)
    .join(' ')
}

function buildPreferenceText(
  preferences,
) {
  const interests =
    Array.isArray(
      preferences.interests,
    )
      ? preferences.interests
      : []

  const activityTypes =
    Array.isArray(
      preferences.activityTypes,
    )
      ? preferences.activityTypes
      : []

  return [
    interests.length
      ? `I am interested in ${interests.join(', ')}.`
      : '',

    activityTypes.length
      ? `I prefer ${activityTypes.join(', ')} activities.`
      : '',
  ]
    .filter(Boolean)
    .join(' ')
}

module.exports = {
  cleanText,
  buildActivityText,
  buildPreferenceText,
}