const fs = require('fs');

const original = JSON.parse(fs.readFileSync('eventfinda_included.json', 'utf-8'));
const fromReview = JSON.parse(fs.readFileSync('eventfinda_review_included.json', 'utf-8'));

const final = [...original, ...fromReview];

// De-duplicate by id, just in case
const seen = new Set();
const deduped = final.filter((e) => {
  if (seen.has(e.id)) return false;
  seen.add(e.id);
  return true;
});

fs.writeFileSync('eventfinda_final_activities.json', JSON.stringify(deduped, null, 2));

console.log(`✅ Original included: ${original.length}`);
console.log(`✅ From review: ${fromReview.length}`);
console.log(`📄 Final merged (deduplicated) activity list: ${deduped.length}`);
console.log('Written to eventfinda_final_activities.json');