const fs = require('fs');

const raw = fs.readFileSync('eventfinda_for_review.json', 'utf-8');
const events = JSON.parse(raw);

// Categories that are a mix of suitable/unsuitable events —
// split these by the `restrictions` field instead of judging the whole category
const MIXED_CATEGORIES = [
  'Comedy',
  'Covers, Tribute Bands',
  'Dance',
  'Festivals',
  'Fashion',
];

// Categories confirmed unsuitable regardless of restrictions field
const CONFIRMED_EXCLUDE = [
  'Rock & Pop',
  'Pop',
  'Cabaret, Burlesque',
  'Alternative, Indie',
  'Reggae',
  'Latin',
  'Classic Rock',
  'Funk',
  'R&B, Soul',
  'Business & Professional',
];

// Categories confirmed suitable regardless of restrictions field
const CONFIRMED_INCLUDE = [
  'Contemporary',
  'Quiz, Karaoke',
];

function isAgeFriendlyRestriction(restrictions) {
  if (!restrictions) return false;
  const r = restrictions.toLowerCase();
  // "All Ages" and "All Ages Licensed" pass; "18+", "16+", "15+" fail
  return r.includes('all ages');
}

const included = [];
const excluded = [];
const stillNeedsReview = [];

for (const event of events) {
  const cat = event.category;

  if (CONFIRMED_INCLUDE.includes(cat)) {
    included.push(event);
  } else if (CONFIRMED_EXCLUDE.includes(cat)) {
    excluded.push(event);
  } else if (MIXED_CATEGORIES.includes(cat)) {
    if (isAgeFriendlyRestriction(event.restrictions)) {
      included.push(event);
    } else {
      excluded.push(event);
    }
  } else {
    // Anything not yet classified (e.g. Quiz/Karaoke) — flag for manual check
    stillNeedsReview.push(event);
  }
}

fs.writeFileSync('eventfinda_review_included.json', JSON.stringify(included, null, 2));
fs.writeFileSync('eventfinda_review_excluded.json', JSON.stringify(excluded, null, 2));
fs.writeFileSync('eventfinda_still_needs_review.json', JSON.stringify(stillNeedsReview, null, 2));

console.log(`✅ Included after restriction-based filtering: ${included.length}`);
console.log(`❌ Excluded: ${excluded.length}`);
console.log(`🕵️ Still needs manual review (uncategorised categories): ${stillNeedsReview.length}`);
console.log(`\nTotal processed: ${events.length}`);