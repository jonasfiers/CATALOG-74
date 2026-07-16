const express = require('express')
const requireAuth = require('../middleware/auth')
const { toIsoDate, timestampToEpochMs } = require('../lib/dates')
const {
  findGroupById,
  membersOfGroup,
  findUserById,
  balanceOfUserInGroup,
  balancesOfGroup,
  avatarColorFor,
  expensesOfGroup,
  sharesOfExpense,
  nextGroupId,
  appendGroup,
  appendMember,
  signedNetBalance,
} = require('../lib/records')

const router = express.Router()
router.use(requireAuth)

function memberShape(userId, groupId) {
  const user = findUserById(userId)
  const balance = balanceOfUserInGroup(groupId, userId)
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    balance: balance ? signedNetBalance(balance) : 0,
    avatarColor: avatarColorFor(user.id),
    avatarEmoji: null,
  }
}

router.post('/', (req, res) => {
  const { title } = req.body || {}
  if (!title) return res.status(400).json({ error: 'title is required' })

  const id = nextGroupId()
  appendGroup({ id, name: title })
  appendMember({ groupId: id, userId: req.user.id })
  res.json({ id })
})

router.get('/:id', (req, res) => {
  const group = findGroupById(req.params.id)
  if (!group) return res.status(404).json({ groups: [] })

  const memberIds = membersOfGroup(group.id)
  const balances = balancesOfGroup(group.id)
  const balancesAsOf = balances.length ? timestampToEpochMs(Math.max(...balances.map(b => b.asOf))) : null

  res.json({
    groups: [
      {
        id: group.id,
        title: group.name,
        icon: null,
        iso: 'EUR',
        balancesAsOf,
        members: memberIds.map(userId => memberShape(userId, group.id)),
      },
    ],
  })
})

router.get('/:id/members', (req, res) => {
  const memberIds = membersOfGroup(req.params.id)
  res.json({ members: memberIds.map(userId => memberShape(userId, req.params.id)) })
})

// Categories are out of scope for this demo, but GroupDetailPage
// fetches this unconditionally on every load -- an empty list is a
// valid, handled response, not an error.
router.get('/:id/category-totals', (req, res) => {
  res.json({ categories: [] })
})

router.get('/:id/expenses', (req, res) => {
  const groupId = Number(req.params.id)
  const skip = Number(req.query.skip || 0)
  const limit = Number(req.query.limit || 25)

  const all = expensesOfGroup(groupId)
    .sort((a, b) => b.date - a.date)
    .map(expense => {
      const payer = findUserById(expense.payerId)
      const myShare = sharesOfExpense(expense.expenseId).find(s => s.owerId === req.user.id)
      return {
        id: expense.expenseId,
        description: expense.description,
        amount: expense.amount,
        date: toIsoDate(expense.date),
        paidByUserId: expense.payerId,
        paidByName: payer ? payer.name : null,
        currencyIso: 'EUR',
        shareAmount: myShare ? myShare.amount : 0,
        isTransfer: false,
        isSettlement: false,
        categoryIcon: null,
      }
    })

  const page = all.slice(skip, skip + limit)
  res.json({ expenses: page, hasMore: skip + limit < all.length })
})

router.delete('/:id', (req, res) => {
  // Master-data deletion isn't implemented -- this is a fixed demo
  // dataset, not a general-purpose app. Acknowledge the request
  // rather than 404ing, since the frontend doesn't gate the UI on it.
  res.json({ success: true })
})

router.delete('/:id/:userId', (req, res) => {
  res.json({ success: true })
})

module.exports = router
