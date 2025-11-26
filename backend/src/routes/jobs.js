const express = require('express')
const { z } = require('zod')
const pool = require('../config/db')
const auth = require('../middleware/auth')

const router = express.Router()

// Validation schemas
const uuidSchema = z.string().uuid('Invalid UUID format')

// Get active jobs by company (public)
router.get('/public/:companyId', async (req, res) => {
  const validation = uuidSchema.safeParse(req.params.companyId)
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid company ID' })
  }

  try {
    const result = await pool.query(
      `SELECT * FROM jobs
       WHERE company_id = $1 AND is_active = true
       ORDER BY created_at DESC`,
      [validation.data]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Get public jobs error:', error)
    res.status(500).json({ error: 'Failed to get jobs' })
  }
})

// Get all jobs for company (protected - for managing)
router.get('/company/:companyId', auth, async (req, res) => {
  const validation = uuidSchema.safeParse(req.params.companyId)
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid company ID' })
  }

  // Check authorization
  if (req.user.company_id !== req.params.companyId) {
    return res.status(403).json({ error: 'Not authorized' })
  }

  try {
    const result = await pool.query(
      'SELECT * FROM jobs WHERE company_id = $1 ORDER BY created_at DESC',
      [validation.data]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Get jobs error:', error)
    res.status(500).json({ error: 'Failed to get jobs' })
  }
})

module.exports = router
