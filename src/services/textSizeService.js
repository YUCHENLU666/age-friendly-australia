// used to store the user's text size preference in local storage
const TEXT_SIZE_KEY =
  'ageFriendlyAustralia.textSize'

// define the available text size options
const TEXT_SIZE_OPTIONS = [
  'standard',
  'large',
  'extra-large',
]

// normalise the text size value to one of the available options, defaulting to 'standard' if the value is not valid
function normaliseTextSize(value) {
  return TEXT_SIZE_OPTIONS.includes(value)
    ? value
    : 'standard'
}

//Read user saved font size from localStorage
export function getTextSize() {
  try {
    return normaliseTextSize(
      localStorage.getItem(TEXT_SIZE_KEY),
    )
  } catch {
    return 'standard'
  }
}

//Apply font size settings to web pages
export function applyTextSize(value) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.textSize =
    normaliseTextSize(value)
}

//Save user font size preference to localStorage and apply it to web pages
export function saveTextSize(value) {
  const textSize = normaliseTextSize(value)

  //save the text size preference to localStorage
  localStorage.setItem(
    TEXT_SIZE_KEY,
    textSize,
  )

  //apply the text size preference to web pages
  applyTextSize(textSize)

  //dispatch a custom event to notify other parts of the app that the text size has been updated
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(
        'age-friendly-text-size-updated',
        {
          detail: { textSize },
        },
      ),
    )
  }

  return textSize
}

//Apply the saved text size preference to web pages when the app starts
//used in main.js to apply the saved text size preference when the app starts
export function applySavedTextSize() {
  applyTextSize(getTextSize())
}
