export function parseCsv(csvText) {
  const rows = []

  let row = []
  let field = ''
  let insideQuotes = false

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        field += '"'
        i += 1
      } else {
        insideQuotes = !insideQuotes
      }

      continue
    }

    if (char === ',' && !insideQuotes) {
      row.push(field.trim())
      field = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i += 1
      }

      row.push(field.trim())
      field = ''

      if (row.some((value) => value !== '')) {
        rows.push(row)
      }

      row = []
      continue
    }

    field += char
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.trim())

    if (row.some((value) => value !== '')) {
      rows.push(row)
    }
  }

  if (rows.length < 2) {
    return []
  }

  const headers = rows[0].map((header) => header.trim())

  return rows.slice(1).map((values) => {
    return headers.reduce((record, header, index) => {
      record[header] = values[index] ?? ''
      return record
    }, {})
  })
}