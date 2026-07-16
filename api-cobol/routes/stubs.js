// Currencies and categories are out of scope for this demo (see
// cobol/copybooks/*.cpy -- neither has a backing record type), but
// the frontend fetches both unconditionally on pages we DO need to
// work, so they need a response that doesn't fail the page's
// Promise.all rather than a 404.
const express = require('express')
const requireAuth = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

router.get('/currencies', (req, res) => {
  res.json({ currencies: [{ iso: 'EUR', symbol: '€', amountOfDecimals: 2 }] })
})

router.get('/categories', (req, res) => {
  res.json({ categories: [] })
})

module.exports = router
