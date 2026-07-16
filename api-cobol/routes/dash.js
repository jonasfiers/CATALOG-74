const express = require('express')
const requireAuth = require('../middleware/auth')
const { toEpochMs } = require('../lib/dates')
const {
  groupsOfUser,
  findGroupById,
  membersOfGroup,
  findUserById,
  balancesOfGroup,
  balanceOfUserInGroup,
  avatarColorFor,
  expensesOfGroup,
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

router.get('/groups', (req, res) => {
  const groups = groupsOfUser(req.user.id).map(groupId => {
    const group = findGroupById(groupId)
    const memberIds = membersOfGroup(groupId)
    const expenses = expensesOfGroup(groupId)
    const lastActivity = expenses.length ? Math.max(...expenses.map(e => toEpochMs(e.date))) : 0

    return {
      id: group.id,
      title: group.name,
      icon: null, // no icon field in GROUP-REC -- frontend falls back to a default
      iso: 'EUR', // no currency field in GROUP-REC -- this demo is single-currency
      lastActivity,
      members: memberIds.map(userId => memberShape(userId, groupId)),
    }
  })
  res.json({ groups })
})

router.get('/balance', (req, res) => {
  const totals = groupsOfUser(req.user.id).reduce(
    (acc, groupId) => {
      const balance = balanceOfUserInGroup(groupId, req.user.id)
      const net = balance ? signedNetBalance(balance) : 0
      if (net > 0) acc.balanceLent += net
      if (net < 0) acc.balanceOwed += -net
      return acc
    },
    { balanceLent: 0, balanceOwed: 0 }
  )

  // No pairwise (per-counterparty) data in this model -- BALANCE-REC
  // is one net figure per person per group, not per relationship --
  // so gross and net are the same here. A real multi-group, multi-
  // counterparty app would have these diverge.
  res.json({
    balanceOwed: totals.balanceOwed,
    balanceLent: totals.balanceLent,
    grossOwed: totals.balanceOwed,
    grossLent: totals.balanceLent,
  })
})

module.exports = router
