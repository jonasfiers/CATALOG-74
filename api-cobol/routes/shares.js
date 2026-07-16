const express = require('express')
const requireAuth = require('../middleware/auth')
const { sharesOfExpense, findExpenseById, readShares, rewriteShares, appendShare } = require('../lib/records')

const router = express.Router()
router.use(requireAuth)

router.post('/', (req, res) => {
  const { expenseId, userId, amount } = req.body || {}
  if (!expenseId || !userId || amount == null) {
    return res.status(400).json({ error: 'expenseId, userId, and amount are required' })
  }
  const expense = findExpenseById(expenseId)
  if (!expense) return res.status(404).json({ error: 'Expense not found' })

  appendShare({
    expenseId: Number(expenseId),
    groupId: expense.groupId,
    owerId: Number(userId),
    amount: Number(amount),
  })
  res.json({ success: true })
})

router.get('/expense/:id', (req, res) => {
  const shares = sharesOfExpense(req.params.id).map(s => ({ userId: s.owerId, amount: s.amount }))
  res.json({ shares })
})

router.get('/expense/:id/excludePayer', (req, res) => {
  const expense = findExpenseById(req.params.id)
  const shares = sharesOfExpense(req.params.id)
    .filter(s => !expense || s.owerId !== expense.payerId)
    .map(s => ({ userId: s.owerId, amount: s.amount }))
  res.json({ shares })
})

router.delete('/expense/:id/user/:userId', (req, res) => {
  const all = readShares()
  const remaining = all.filter(
    s => !(s.expenseId === Number(req.params.id) && s.owerId === Number(req.params.userId))
  )
  rewriteShares(remaining)
  res.json({ success: true })
})

module.exports = router
