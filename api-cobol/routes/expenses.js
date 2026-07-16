const express = require('express')
const requireAuth = require('../middleware/auth')
const { toIsoDate } = require('../lib/dates')
const {
  findExpenseById,
  sharesOfExpense,
  findUserById,
  findGroupById,
  nextExpenseId,
  appendExpense,
  readExpenses,
  rewriteExpenses,
} = require('../lib/records')

const router = express.Router()
router.use(requireAuth)

// The form sends an ISO date string ("2026-04-04") or may already be
// a plain YYYYMMDD-looking value -- normalize either into the
// YYYYMMDD integer EXPENSE-REC.DATE actually stores.
function toDateInt(value) {
  const digits = String(value).replace(/\D/g, '')
  return digits.length >= 8 ? parseInt(digits.slice(0, 8), 10) : parseInt(digits, 10)
}

router.post('/', (req, res) => {
  const { groupId, description, amount, date, paidByUserId } = req.body || {}
  if (!groupId || !amount || !paidByUserId) {
    return res.status(400).json({ error: 'groupId, amount, and paidByUserId are required' })
  }

  const expenseId = nextExpenseId()
  appendExpense({
    expenseId,
    groupId: Number(groupId),
    payerId: Number(paidByUserId),
    amount: Number(amount),
    description: description || '',
    date: toDateInt(date),
  })
  res.json({ id: expenseId })
})

router.put('/:id', (req, res) => {
  const { groupId, description, amount, date, paidByUserId } = req.body || {}
  const all = readExpenses()
  const idx = all.findIndex(e => e.expenseId === Number(req.params.id))
  if (idx === -1) return res.status(404).json({ error: 'Expense not found' })

  all[idx] = {
    ...all[idx],
    groupId: groupId != null ? Number(groupId) : all[idx].groupId,
    payerId: paidByUserId != null ? Number(paidByUserId) : all[idx].payerId,
    amount: amount != null ? Number(amount) : all[idx].amount,
    description: description ?? all[idx].description,
    date: date != null ? toDateInt(date) : all[idx].date,
  }
  rewriteExpenses(all)
  res.json({ id: all[idx].expenseId })
})

router.get('/:id', (req, res) => {
  const expense = findExpenseById(req.params.id)
  if (!expense) return res.json({ expense: null })

  const payer = findUserById(expense.payerId)
  const group = findGroupById(expense.groupId)
  res.json({
    expense: {
      description: expense.description,
      paidByUserId: expense.payerId,
      paidByName: payer ? payer.name : null,
      amount: expense.amount,
      currencyIso: 'EUR',
      amountBase: expense.amount, // single-currency demo -- always equal
      groupCurrencyIso: 'EUR',
      date: toIsoDate(expense.date),
      categoryName: null,
      categoryIcon: null,
      isTransfer: false,
      isSettlement: false,
      groupId: group ? group.id : expense.groupId,
    },
  })
})

router.delete('/:id', (req, res) => {
  const all = readExpenses()
  const remaining = all.filter(e => e.expenseId !== Number(req.params.id))
  rewriteExpenses(remaining)
  res.json({ success: true })
})

module.exports = router
