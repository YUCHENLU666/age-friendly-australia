require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });

const fs = require('fs');

const BASE_URL = process.env.EVENTFINDA_BASE_URL;
const USERNAME = process.env.EVENTFINDA_USERNAME;
const PASSWORD = process.env.EVENTFINDA_PASSWORD;

const authHeader = 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

async function fetchAllEvents() {
  const rowsPerPage = 50; // requested page size (actual returned size may be smaller — see note below)
  let offset = 0;
  let allEvents = [];
  let total = null;

  while (total === null || offset < total) {
    const url = `${BASE_URL}/events.json?location_slug=melbourne&rows=${rowsPerPage}&offset=${offset}&order=popularity`;

    const response = await fetch(url, {
      headers: { Authorization: authHeader },
    });

    if (!response.ok) {
      console.error(`❌ Request failed at offset ${offset}: ${response.status}`);
      console.error(await response.text());
      break;
    }

    const data = await response.json();
    total = data['@attributes']?.count ?? 0;

    const pageEvents = data.events || [];
    if (pageEvents.length === 0) {
      console.log('⚠️ Received an empty page — stopping early (possible free-tier pagination limit).');
      break;
    }

    allEvents = allEvents.concat(pageEvents);
    console.log(`Fetched ${allEvents.length}/${total}...`);

    // Advance offset by however many events we actually got, not the requested rows count.
    // The free tier appears to cap the number of events returned per request below
    // the requested `rows` value, so using the requested count here would skip events.
    offset += pageEvents.length;

    // Respect Eventfinda's rate limit (max 1 request per second)
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  // De-duplicate by id — pagination against a live, popularity-sorted feed
  // can occasionally return the same event twice if its rank shifts
  // between requests.
  const seen = new Set();
  const deduped = allEvents.filter((event) => {
    if (seen.has(event.id)) return false;
    seen.add(event.id);
    return true;
  });

  if (deduped.length !== allEvents.length) {
    console.log(`⚠️ Removed ${allEvents.length - deduped.length} duplicate event(s) introduced by pagination drift.`);
  }

  return deduped;
}

function extractImageUrl(event) {
  const images = event.images?.images || [];
  if (images.length === 0) return null;

  // Prefer the primary image; fall back to the first available image
  const primaryImage = images.find((img) => img.is_primary) || images[0];

  // Prefer the 190x127 thumbnail (transformation_id 8) for card display;
  // fall back to the 350x350 crop, then the original full-size image
  const transforms = primaryImage.transforms?.transforms || [];
  const thumbnail = transforms.find((t) => t.transformation_id === 8);
  const squareCrop = transforms.find((t) => t.transformation_id === 27);

  return thumbnail?.url || squareCrop?.url || primaryImage.original_url || null;
}

function extractKeyFields(event) {
  return {
    id: event.id,
    name: event.name,
    description: event.description ? event.description.slice(0, 200) : '',
    category: event.category?.name || event.category || null,
    is_free: event.is_free,
    datetime_start: event.datetime_start,
    datetime_end: event.datetime_end,
    address: event.address || null,
    location_summary: event.location_summary || null,
    lat: event.point?.lat || null,
    lng: event.point?.lng || null,
    restrictions: event.restrictions || null,
    url: event.url,
    image_url: extractImageUrl(event),
  };
}

async function main() {
  console.log('Fetching all events from Eventfinda (Melbourne)...');
  const allEvents = await fetchAllEvents();

  console.log(`\n✅ Total events fetched: ${allEvents.length}`);

  // Extract clean, minimal fields
  const cleaned = allEvents.map(extractKeyFields);
  fs.writeFileSync('eventfinda_cleaned_events.json', JSON.stringify(cleaned, null, 2));
  console.log('📄 Cleaned event list written to eventfinda_cleaned_events.json');

  // Category distribution
  const categoryCounts = {};
  for (const event of cleaned) {
    const cat = event.category || 'Unknown';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  }

  const sortedCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);

  console.log('\n📊 Category distribution:');
  for (const [cat, count] of sortedCategories) {
    console.log(`  ${cat}: ${count}`);
  }

  fs.writeFileSync(
    'eventfinda_category_distribution.json',
    JSON.stringify(Object.fromEntries(sortedCategories), null, 2)
  );
  console.log('\n📄 Category distribution written to eventfinda_category_distribution.json');
}

main();