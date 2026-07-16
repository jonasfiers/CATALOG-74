// Shared by the manual /batch/run route and the nightly scheduler in
// index.js -- both are just callers of the same underlying batch cycle
// (sort/control-break/merge), the same one a mainframe shop would kick
// off from JES either on a schedule or by hand.
const { execFile } = require('child_process')
const path = require('path')
const { DATA_DIR } = require('./records')

const BATCH_SCRIPT = process.env.BATCH_SCRIPT || path.join(__dirname, '..', '..', 'cobol', 'scripts', 'run-batch.sh')
const BIN_DIR = process.env.BIN_DIR || DATA_DIR

let running = false

function runBatch() {
  if (running) return Promise.reject(new Error('A batch run is already in progress'))

  running = true
  const startedAt = Date.now()
  return new Promise((resolve, reject) => {
    execFile(BATCH_SCRIPT, { env: { ...process.env, DATA_DIR, BIN_DIR } }, (error, stdout, stderr) => {
      running = false
      if (error) return reject(new Error(stderr || error.message))
      resolve({ durationMs: Date.now() - startedAt, output: stdout.trim() })
    })
  })
}

module.exports = { runBatch, isRunning: () => running }
