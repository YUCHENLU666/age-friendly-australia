const fs = require('fs');

const raw = fs.readFileSync('eventfinda_final_activities.json', 'utf-8');
const events = JSON.parse(raw);

// Keywords that suggest adult-oriented content unsuitable for an age-friendly platform,
// regardless of which category the event was filed under
const FLAG_KEYWORDS = [
  'burlesque',
  'strip',
  'naked',
  'nude',
  'erotic',
  'lingerie',
  'adult only',
  'r18',
  'x-rated',
];

function containsFlaggedKeyword(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return FLAG_KEYWORDS.some((kw) => lower.includes(kw));
}

const flagged = events.filter((e) => {
  const combinedText = `${e.name || ''} ${e.description || ''}`;
  return containsFlaggedKeyword(combinedText);
});

console.log(`🚩 Flagged for manual review: ${flagged.length}\n`);
for (const e of flagged) {
  console.log(`- [${e.category}] ${e.name}`);
  console.log(`  ${e.location_summary || e.address || ''}\n`);
}

fs.writeFileSync('eventfinda_flagged_for_review.json', JSON.stringify(flagged, null, 2));
console.log('📄 Full details written to eventfinda_flagged_for_review.json');