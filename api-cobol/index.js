const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const dashRoutes = require('./routes/dash')
const groupRoutes = require('./routes/groups')
const expenseRoutes = require('./routes/expenses')
const shareRoutes = require('./routes/shares')
const stubRoutes = require('./routes/stubs')
const batchRoutes = require('./routes/batch')
const { runBatch } = require('./lib/batch')

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set')
}

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use('/auth', authRoutes)
app.use('/dash', dashRoutes)
app.use('/groups', groupRoutes)
app.use('/expenses', expenseRoutes)
app.use('/shares', shareRoutes)
app.use('/batch', batchRoutes)
app.use('/', stubRoutes) // /currencies, /categories

const PORT = process.env.API_PORT || process.env.PORT || 3000
app.listen(PORT, () => console.log(`api-cobol listening on :${PORT}`))

// The nightly cycle a real mainframe shop would run from JES on a
// schedule -- here, a plain interval instead of a system cron daemon,
// since this process is the only thing running in its container.
const BATCH_INTERVAL_MS = Number(process.env.BATCH_INTERVAL_MS || 24 * 60 * 60 * 1000)
setInterval(() => {
  runBatch()
    .then(r => console.log(`[batch] nightly run complete in ${r.durationMs}ms`))
    .catch(err => console.error('[batch] nightly run failed:', err.message))
}, BATCH_INTERVAL_MS)
