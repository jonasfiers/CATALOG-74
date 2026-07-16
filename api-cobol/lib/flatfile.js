// Generic reader/writer for the fixed-width flat files the COBOL
// programs produce and consume. This is the one place that knows how
// to turn a copybook-shaped byte range into a JS value and back --
// every route just deals in plain objects.
const fs = require('fs')

function padInt(value, len) {
  return String(Math.trunc(value)).padStart(len, '0')
}

function padStr(value, len) {
  return (value ?? '').toString().slice(0, len).padEnd(len, ' ')
}

function parseField(line, field) {
  const raw = line.slice(field.start, field.start + field.len)
  if (field.type === 'int') return parseInt(raw, 10)
  return raw.trimEnd()
}

function parseLine(spec, line) {
  const record = {}
  for (const field of spec) record[field.name] = parseField(line, field)
  return record
}

function formatField(record, field) {
  const value = record[field.name]
  return field.type === 'int' ? padInt(value, field.len) : padStr(value, field.len)
}

function formatLine(spec, record) {
  return spec.map(field => formatField(record, field)).join('')
}

function readRecords(path, spec) {
  if (!fs.existsSync(path)) return []
  return fs
    .readFileSync(path, 'utf8')
    .split('\n')
    .filter(line => line.length > 0)
    .map(line => parseLine(spec, line))
}

function appendRecord(path, spec, record) {
  fs.appendFileSync(path, formatLine(spec, record) + '\n')
}

// Flat files have no update-in-place or delete -- editing a record
// means rewriting the whole file with the new set of records. Fine
// at this scale (a demo dataset); a real mainframe would do the same
// thing via a full master-file rewrite pass, just with more ceremony.
function writeAllRecords(path, spec, records) {
  const content = records.map(record => formatLine(spec, record)).join('\n')
  fs.writeFileSync(path, content.length ? content + '\n' : '')
}

// BALANCE-REC's NET-BALANCE is split across two fields (magnitude +
// separate sign) because that's how SIGN IS TRAILING SEPARATE lays
// it out on disk. Callers want one signed number.
function signedNetBalance(balanceRecord) {
  return balanceRecord.sign === '-' ? -balanceRecord.netBalance : balanceRecord.netBalance
}

module.exports = { readRecords, appendRecord, writeAllRecords, formatLine, signedNetBalance }
