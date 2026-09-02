const TEXT_SIZE_KEY =
  'ageFriendlyAustralia.textSize'

const TEXT_SIZE_OPTIONS = [
  'standard',
  'large',
  'extra-large',
]

function normaliseTextSize(value) {
  return TEXT_SIZE_OPTIONS.includes(value)
    ? value
    : 'standard'
}

export function getTextSize() {
  try {
    return normaliseTextSize(
      localStorage.getItem(TEXT_SIZE_KEY),
    )
  } catch {
    return 'standard'
  }
}

export function applyTextSize(value) {
  if (typeof document === 'undefined') {
    return
  }

  document.documentElement.dataset.textSize =
    normaliseTextSize(value)
}

export function saveTextSize(value) {
  const textSize = normaliseTextSize(value)

  localStorage.setItem(
    TEXT_SIZE_KEY,
    textSize,
  )

  applyTextSize(textSize)

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

export function applySavedTextSize() {
  applyTextSize(getTextSize())
}
