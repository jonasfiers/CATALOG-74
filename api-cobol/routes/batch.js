// Manual trigger for the batch cycle -- lets a demo visitor add an
// expense and immediately see it NOT reflected in their balance,
// then force the same batch run that would otherwise only happen on
// the nightly cron, and watch the number actually change. That gap
// is the entire point of this project; this route exists to make it
// visible on demand instead of requiring an overnight wait.
const express = require('express')
const { execFile } = require('child_process')
const path = require('path')
const requireAuth = require('../middleware/auth')
const { DATA_DIR } = require('../lib/records')

const router = express.Router()
router.use(requireAuth)

const BATCH_SCRIPT = process.env.BATCH_SCRIPT || path.join(__dirname, '..', '..', 'cobol', 'scripts', 'run-batch.sh')
const BIN_DIR = process.env.BIN_DIR || DATA_DIR

let running = false

router.post('/run', (req, res) => {
  if (running) return res.status(409).json({ error: 'A batch run is already in progress' })

  running = true
  const startedAt = Date.now()
  execFile(BATCH_SCRIPT, { env: { ...process.env, DATA_DIR, BIN_DIR } }, (error, stdout, stderr) => {
    running = false
    if (error) {
      console.error('[batch] failed:', stderr || error.message)
      return res.status(500).json({ error: 'Batch run failed', detail: stderr || error.message })
    }
    res.json({ success: true, durationMs: Date.now() - startedAt, output: stdout.trim() })
  })
})

module.exports = router
