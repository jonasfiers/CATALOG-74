const path = require('path')
const { readRecords, appendRecord, writeAllRecords, signedNetBalance } = require('./flatfile')
const specs = require('./specs')

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', 'data')
const file = name => path.join(DATA_DIR, name)

// Master/reference data (seeded, not written by this API)
const readUsers = () => readRecords(file('USER-MASTER.DAT'), specs.USER_SPEC)
const readAuth = () => readRecords(file('USER-AUTH.DAT'), specs.USER_AUTH_SPEC)
const readGroups = () => readRecords(file('GROUP-MASTER.DAT'), specs.GROUP_SPEC)
const readMembers = () => readRecords(file('MEMBER-MASTER.DAT'), specs.MEMBER_SPEC)

// Transactional data -- this API appends to these; the batch job
// reads them, sorts them, and derives balances from them.
const readExpenses = () => readRecords(file('EXPENSE-MASTER.DAT'), specs.EXPENSE_SPEC)
const readShares = () => readRecords(file('SHARE-TRANS.DAT'), specs.SHARE_SPEC)

// Derived output -- only ever written by MERGE-BALANCE, never by this API.
const readBalances = () => readRecords(file('BALANCE-MASTER.DAT'), specs.BALANCE_SPEC)

const findUserById = id => readUsers().find(u => u.id === Number(id))
const findUserByEmail = email =>
  readUsers().find(u => u.email.toLowerCase() === String(email).toLowerCase())
const findAuthByUserId = id => readAuth().find(a => a.id === Number(id))
const findGroupById = id => readGroups().find(g => g.id === Number(id))

const membersOfGroup = groupId =>
  readMembers()
    .filter(m => m.groupId === Number(groupId))
    .map(m => m.userId)

const groupsOfUser = userId =>
  readMembers()
    .filter(m => m.userId === Number(userId))
    .map(m => m.groupId)

const expensesOfGroup = groupId => readExpenses().filter(e => e.groupId === Number(groupId))
const findExpenseById = id => readExpenses().find(e => e.expenseId === Number(id))
const sharesOfExpense = expenseId => readShares().filter(s => s.expenseId === Number(expenseId))

const balancesOfGroup = groupId => readBalances().filter(b => b.groupId === Number(groupId))
const balanceOfUserInGroup = (groupId, userId) =>
  readBalances().find(b => b.groupId === Number(groupId) && b.userId === Number(userId))

// A handful of fixed colors is enough for a 3-person demo -- no
// AVATAR-COLOR field exists in USER-REC, this is presentation-only.
const AVATAR_PALETTE = ['coral', 'violet', 'gold', 'teal', 'rose']
const avatarColorFor = userId => AVATAR_PALETTE[Number(userId) % AVATAR_PALETTE.length]

const nextExpenseId = () => {
  const existing = readExpenses().map(e => e.expenseId)
  return (existing.length ? Math.max(...existing) : 0) + 1
}

const nextGroupId = () => {
  const existing = readGroups().map(g => g.id)
  return (existing.length ? Math.max(...existing) : 0) + 1
}

const appendGroup = ({ id, name }) => {
  appendRecord(file('GROUP-MASTER.DAT'), specs.GROUP_SPEC, { id, name })
}

const appendMember = ({ groupId, userId }) => {
  appendRecord(file('MEMBER-MASTER.DAT'), specs.MEMBER_SPEC, { groupId, userId })
}

const appendExpense = ({ expenseId, groupId, payerId, amount, description, date }) => {
  appendRecord(file('EXPENSE-MASTER.DAT'), specs.EXPENSE_SPEC, {
    expenseId,
    groupId,
    payerId,
    amount,
    description,
    date,
  })
}

const appendShare = ({ expenseId, groupId, owerId, amount }) => {
  appendRecord(file('SHARE-TRANS.DAT'), specs.SHARE_SPEC, { expenseId, groupId, owerId, amount })
}

const rewriteExpenses = records => writeAllRecords(file('EXPENSE-MASTER.DAT'), specs.EXPENSE_SPEC, records)
const rewriteShares = records => writeAllRecords(file('SHARE-TRANS.DAT'), specs.SHARE_SPEC, records)

module.exports = {
  DATA_DIR,
  readUsers,
  readAuth,
  readGroups,
  readMembers,
  readExpenses,
  readShares,
  readBalances,
  findUserById,
  findUserByEmail,
  findAuthByUserId,
  findGroupById,
  membersOfGroup,
  groupsOfUser,
  expensesOfGroup,
  findExpenseById,
  sharesOfExpense,
  balancesOfGroup,
  balanceOfUserInGroup,
  avatarColorFor,
  nextExpenseId,
  appendExpense,
  appendShare,
  rewriteExpenses,
  rewriteShares,
  nextGroupId,
  appendGroup,
  appendMember,
  signedNetBalance,
}
