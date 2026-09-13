const fs = require('fs');

const raw = fs.readFileSync('eventfinda_uncategorised.json', 'utf-8');
const events = JSON.parse(raw);

const categoryCounts = {};
for (const event of events) {
  const cat = event.category || 'Unknown';
  categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
}

const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

console.log(`📊 Uncategorised breakdown (${events.length} total):\n`);
for (const [cat, count] of sorted) {
  console.log(`  ${cat}: ${count}`);
}