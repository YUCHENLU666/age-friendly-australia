const { getBusPositions } = require('./ptvRealtimeService')

async function run() {
  const vehicles = await getBusPositions(null, 10)
  console.log('Found', vehicles.length, 'buses:')
  console.log(JSON.stringify(vehicles, null, 2))
}

run()