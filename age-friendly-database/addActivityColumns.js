const path = require('path')
const sqlite3 = require('sqlite3').verbose()

const dbPath = path.join(__dirname, 'age-friendly.db')
const db = new sqlite3.Database(dbPath)

const columnsToAdd = [
  { name: 'description', type: 'TEXT' },
  { name: 'is_free', type: 'INTEGER' },
  { name: 'latitude', type: 'REAL' },
  { name: 'longitude', type: 'REAL' },
  { name: 'restrictions', type: 'TEXT' },
  { name: 'url', type: 'TEXT' },
  { name: 'image_url', type: 'TEXT' },
]

async function addColumns() {
  for (const col of columnsToAdd) {
    await new Promise((resolve) => {
      db.run(`ALTER TABLE activities ADD COLUMN ${col.name} ${col.type}`, (err) => {
        if (err) {
          console.log(`Skipped ${col.name}: ${err.message}`)
        } else {
          console.log(`Added column: ${col.name}`)
        }
        resolve()
      })
    })
  }
  db.close()
}

addColumns()