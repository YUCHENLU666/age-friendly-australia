const { getCommunityVenues } = require('./vicmapFoiService')

async function run() {
  const venues = await getCommunityVenues('community venue', 'senior citizens', 10)
  console.log('Found', venues.length, 'senior citizens venues:')
  console.log(JSON.stringify(venues, null, 2))
}

run()