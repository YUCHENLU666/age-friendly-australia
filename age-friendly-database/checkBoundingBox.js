const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const CSV_PATH = path.join(__dirname, '..', 'data', 'sample', 'gtfs_stops_southeast_melbourne.csv')

let minLat = Infinity, maxLat = -Infinity
let minLon = Infinity, maxLon = -Infinity

fs.createReadStream(CSV_PATH)
  .pipe(csv())
  .on('data', (row) => {
    const lat = parseFloat(row.latitude)
    const lon = parseFloat(row.longitude)
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lon < minLon) minLon = lon
    if (lon > maxLon) maxLon = lon
  })
  .on('end', () => {
    console.log('Bounding box used in the original 4,994-stop dataset:')
    console.log(`Latitude range: ${minLat} to ${maxLat}`)
    console.log(`Longitude range: ${minLon} to ${maxLon}`)
  })