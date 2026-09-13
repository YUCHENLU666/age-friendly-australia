require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });

const fs = require('fs');

const BASE_URL = process.env.EVENTFINDA_BASE_URL;
const USERNAME = process.env.EVENTFINDA_USERNAME;
const PASSWORD = process.env.EVENTFINDA_PASSWORD;

async function testEventfindaConnection() {
  if (!BASE_URL || !USERNAME || !PASSWORD) {
    console.error('❌ Missing EVENTFINDA_BASE_URL, EVENTFINDA_USERNAME or EVENTFINDA_PASSWORD');
    return;
  }

  const authHeader = 'Basic ' + Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

  // Start broad: Melbourne region, no category filter, small row count for testing
  const url = `${BASE_URL}/events.json?location_slug=melbourne&rows=20&order=popularity`;

  try {
    const response = await fetch(url, {
      headers: { Authorization: authHeader },
    });

    if (!response.ok) {
      console.error(`❌ Request failed: ${response.status} ${response.statusText}`);
      console.error(await response.text());
      return;
    }

    const data = await response.json();

    // Write full response to a file instead of dumping it to the terminal,
    // since the terminal buffer truncates long output.
    fs.writeFileSync('eventfinda_test_output.json', JSON.stringify(data, null, 2));

    console.log(`✅ Connected. Events returned: ${data.events ? data.events.length : 0}`);
    console.log('📄 Full response written to eventfinda_test_output.json');
  } catch (err) {
    console.error('❌ Error calling Eventfinda API:', err.message);
  }
}

testEventfindaConnection();