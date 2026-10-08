// age-friendly-database/ai/activityText.js
// Make the text that the AI reads for activities and preferences.
//
// How calls move:
// buildActivityText/buildPreferenceText -> clean text fields -> embeddingService; activity text also feeds SHA-256 checks.
//
// Reading tips:
//   Examples show one possible case, not fixed API or model results.
//   Promise: a result to wait for; await gets the result when the work finishes.
//   vector / embedding: a list of numbers for the meaning of text.
//   hash: a text check code; changed text gets a different code.
//
// Functions:
//   cleanText - Remove HTML tags, change common HTML codes back to text, and remove extra spaces.
//   buildActivityText - Put the activity name, category, and description into one text for the AI.
//   buildPreferenceText - Put interests and activity types into one text for the AI.
//
// Notes:
//   Area and day choices are scored separately; they are not put in this AI text.
//   cleanText prepares text for AI; it is not a full HTML safety check.

// Remove HTML tags, change common HTML codes back to text, and remove extra spaces.
// Example input: ' <b>Art</b> &amp; music '
// Example result: 'Art & music'.
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

// Put the activity name, category, and description into one text for the AI.
// Example input: {event_name:'Walk', category_tags:'Nature', description:'Easy walk'}
// Example result: 'Activity: Walk. Category: Nature. Description: Easy walk'.
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

// Put interests and activity types into one text for the AI.
// Example input: {interests:['Music'], activityTypes:['Arts & crafts']}
// Example result: 'I am interested in Music. I prefer Arts & crafts activities.'.
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