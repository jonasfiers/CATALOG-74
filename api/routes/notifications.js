const router = require('express').Router()
const pushService = require('../pushService')

router.get('/vapid-key', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
})

router.post('/subscribe', async (req, res) => {
    try {
        await pushService.saveSubscription(req.user.id, req.body.subscription)
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

router.delete('/subscribe', async (req, res) => {
    try {
        await pushService.deleteSubscription(req.user.id, req.body.endpoint)
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: err.message })
    }
})

module.exports = router
