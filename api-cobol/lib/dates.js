// EXPENSE-REC.DATE is a plain YYYYMMDD integer (see EXPENSE-REC.cpy)
// -- the frontend does `new Date(value)` in a few places, which reads
// a bare integer as epoch milliseconds, not a calendar date, landing
// near 1970-01-01. Every date sent to the frontend needs to go
// through one of these instead of being passed through raw.

function toIsoDate(dateInt) {
  const s = String(dateInt).padStart(8, '0')
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

function toEpochMs(dateInt) {
  return new Date(`${toIsoDate(dateInt)}T00:00:00Z`).getTime()
}

// AS-OF-TIMESTAMP is a plain YYYYMMDDHHMMSS integer (see BALANCE-REC.cpy,
// set from FUNCTION CURRENT-DATE by MERGE-BALANCE) -- convert to epoch ms
// the same way toEpochMs does for dates, so the frontend can format it.
function timestampToEpochMs(ts14) {
  const s = String(ts14).padStart(14, '0')
  const iso = `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(8, 10)}:${s.slice(10, 12)}:${s.slice(12, 14)}Z`
  return new Date(iso).getTime()
}

module.exports = { toIsoDate, toEpochMs, timestampToEpochMs }
