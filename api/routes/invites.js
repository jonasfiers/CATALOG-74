const router = require('express').Router();
const auth = require('../middleware/auth');
const { inviteService } = require('../crudService');

router.get('/:token', async (req, res) => {
    try {
        const result = await inviteService.getInviteInfo(req.params.token);
        if (!result.success) return res.status(404).json(result);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/groups/:id', auth, async (req, res) => {
    try {
        const result = await inviteService.createInvite(req.params.id, req.user.id);
        res.json(result);
    } catch (err) {
        res.status(err.message === 'Access denied' ? 403 : 500).json({ error: err.message });
    }
});

router.post('/:token/redeem', auth, async (req, res) => {
    try {
        const result = await inviteService.redeemInvite(req.params.token, req.user.id);
        if (!result.success) return res.status(404).json(result);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;