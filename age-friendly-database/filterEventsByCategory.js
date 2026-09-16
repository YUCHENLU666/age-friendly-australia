const fs = require('fs');

// Categories confirmed as suitable for older adults
const INCLUDE_CATEGORIES = [
  'Classical Music',
  'Jazz',
  'Opera',
  'Choir, Vocal Music',
  'Folk',
  'Theatre',
  'Musicals',
  'Mind & Body',
  'Expos',
  'Markets and Fairs',
  'Museums',
  'Craft & Object Art',
  'Dance Classes',
  'Forums, Lectures',
  'Literary',
  'Education',
  // Newly added after uncategorised review
  'Creative',
  'Chamber Music',
  'Acoustic, Instrumental',
  'Blues',
  'Country',
  'Soul',
  'Ethnic, Multicultural',
  'Family Entertainment',
  'Magic, Variety',
  'Variety Concerts',
  'Live Performance',
  'Film',
  'Food/Produce Market',
  'Socials and Balls',
  'Games, Hobbies',
  'Circus',
  'Ceremonies, Commemorations',
];

// Categories excluded — nightlife / high-intensity / not age-friendly
const EXCLUDE_CATEGORIES = [
  'Bar DJs',
  'Punk',
  'Metal, Hardcore',
  'Electronica',
  'House',
  'Hip Hop, Rap',
  'Athletics',
  'Fun Runs & Walks',
  'Equestrian',
  // Newly added after uncategorised review
  'Children, Kids, Holidays',
  'Cricket',
];

// Categories still under review — kept out for now, flagged for manual check
const REVIEW_CATEGORIES = [
  'Comedy',
  'Cabaret, Burlesque',
  'Rock & Pop',
  'Covers, Tribute Bands',
  'Pop',
  'Dance',
  'Alternative, Indie',
  'Classic Rock',
  'Reggae',
  'Latin',
  'Funk',
  'R&B, Soul',
  'Festivals',
  'Business & Professional',
  'Quiz, Karaoke',
  // Newly added — single event, ambiguous category name
  'Contemporary',
  'Fashion',
];

function filterEvents() {
  const raw = fs.readFileSync('eventfinda_cleaned_events.json', 'utf-8');
  const events = JSON.parse(raw);

  const included = events.filter((e) => INCLUDE_CATEGORIES.includes(e.category));
  const excluded = events.filter((e) => EXCLUDE_CATEGORIES.includes(e.category));
  const forReview = events.filter((e) => REVIEW_CATEGORIES.includes(e.category));
  const uncategorised = events.filter(
    (e) =>
      !INCLUDE_CATEGORIES.includes(e.category) &&
      !EXCLUDE_CATEGORIES.includes(e.category) &&
      !REVIEW_CATEGORIES.includes(e.category)
  );

  fs.writeFileSync('eventfinda_included.json', JSON.stringify(included, null, 2));
  fs.writeFileSync('eventfinda_for_review.json', JSON.stringify(forReview, null, 2));
  fs.writeFileSync('eventfinda_excluded.json', JSON.stringify(excluded, null, 2));
  fs.writeFileSync('eventfinda_uncategorised.json', JSON.stringify(uncategorised, null, 2));

  console.log(`✅ Included (confirmed age-friendly): ${included.length}`);
  console.log(`🕵️ For review (needs manual check): ${forReview.length}`);
  console.log(`❌ Excluded (nightlife/high-intensity): ${excluded.length}`);
  console.log(`❓ Uncategorised (not yet classified): ${uncategorised.length}`);
  console.log(`\nTotal processed: ${events.length}`);
}

filterEvents();