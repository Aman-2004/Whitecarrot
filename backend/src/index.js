require('dotenv').config()
const express = require('express')
const cors = require('cors')

// Import routes
const authRoutes = require('./routes/auth')
const companiesRoutes = require('./routes/companies')
const sectionsRoutes = require('./routes/sections')
const jobsRoutes = require('./routes/jobs')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/companies', companiesRoutes)
app.use('/api/sections', sectionsRoutes)
app.use('/api/jobs', jobsRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
