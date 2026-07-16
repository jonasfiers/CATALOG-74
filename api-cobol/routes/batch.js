// Manual trigger for the batch cycle -- lets a demo visitor add an
// expense and immediately see it NOT reflected in their balance,
// then force the same batch run that would otherwise only happen on
// the nightly schedule (see index.js), and watch the number actually
// change. That gap is the entire point of this project; this route
// exists to make it visible on demand instead of requiring an
// overnight wait.
const express = require('express')
const requireAuth = require('../middleware/auth')
const { runBatch } = require('../lib/batch')

const router = express.Router()
router.use(requireAuth)

router.post('/run', (req, res) => {
  runBatch()
    .then(result => res.json({ success: true, ...result }))
    .catch(error => {
      if (error.message === 'A batch run is already in progress') {
        return res.status(409).json({ error: error.message })
      }
      console.error('[batch] failed:', error.message)
      res.status(500).json({ error: 'Batch run failed', detail: error.message })
    })
})

module.exports = router
