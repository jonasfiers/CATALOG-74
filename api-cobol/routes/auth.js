const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { findUserByEmail, findAuthByUserId } = require('../lib/records')

const JWT_SECRET = process.env.JWT_SECRET
const router = express.Router()

// The frontend decodes the JWT payload client-side and reads
// `currentUser.id` directly off it -- there's no /auth/me endpoint,
// so the payload itself has to carry everything the app needs.
router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  const user = email && findUserByEmail(email)
  const auth = user && findAuthByUserId(user.id)

  if (!auth || !bcrypt.compareSync(password || '', auth.hash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, {
    expiresIn: '7d',
  })
  res.json({ token })
})

// This is a fixed demo with three pre-seeded logins, not a real
// multi-tenant app -- self-registration is intentionally disabled
// rather than half-implemented against a schema that doesn't support
// it (see cobol/seed-data/README.md for the actual demo credentials).
router.post('/register', (req, res) => {
  res.status(403).json({
    error: 'Registration is disabled on this demo. Log in as You / Mila / Theo instead.',
  })
})

module.exports = router
