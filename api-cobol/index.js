const express = require('express')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const dashRoutes = require('./routes/dash')
const groupRoutes = require('./routes/groups')
const expenseRoutes = require('./routes/expenses')
const shareRoutes = require('./routes/shares')
const stubRoutes = require('./routes/stubs')
const batchRoutes = require('./routes/batch')

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set')
}

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use('/auth', authRoutes)
app.use('/dash', dashRoutes)
app.use('/groups', groupRoutes)
app.use('/expenses', expenseRoutes)
app.use('/shares', shareRoutes)
app.use('/batch', batchRoutes)
app.use('/', stubRoutes) // /currencies, /categories

const PORT = process.env.API_PORT || process.env.PORT || 3000
app.listen(PORT, () => console.log(`api-cobol listening on :${PORT}`))
