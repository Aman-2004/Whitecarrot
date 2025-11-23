const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { z } = require('zod')
const pool = require('../config/db')
const auth = require('../middleware/auth')

const router = express.Router()

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Login
router.post('/login', async (req, res) => {
  // Validate input
  const validation = loginSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    })
  }

  const { email, password } = validation.data

  try {
    // Find recruiter with company
    const result = await pool.query(
      `SELECT r.*, c.id as company_id, c.name as company_name, c.slug as company_slug,
              c.logo_url, c.banner_url, c.primary_color, c.secondary_color
       FROM recruiters r
       JOIN companies c ON r.company_id = c.id
       WHERE r.email = $1`,
      [email]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const recruiter = result.rows[0]

    // Check password
    const validPassword = await bcrypt.compare(password, recruiter.password_hash)
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: recruiter.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.json({
      token,
      user: {
        id: recruiter.id,
        email: recruiter.email,
        name: recruiter.name,
      },
      company: {
        id: recruiter.company_id,
        name: recruiter.company_name,
        slug: recruiter.company_slug,
        logo_url: recruiter.logo_url,
        banner_url: recruiter.banner_url,
        primary_color: recruiter.primary_color,
        secondary_color: recruiter.secondary_color,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Login failed' })
  }
})

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.id, r.email, r.name,
              c.id as company_id, c.name as company_name, c.slug as company_slug,
              c.logo_url, c.banner_url, c.primary_color, c.secondary_color, c.culture_video_url
       FROM recruiters r
       JOIN companies c ON r.company_id = c.id
       WHERE r.id = $1`,
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const data = result.rows[0]

    res.json({
      user: {
        id: data.id,
        email: data.email,
        name: data.name,
      },
      company: {
        id: data.company_id,
        name: data.company_name,
        slug: data.company_slug,
        logo_url: data.logo_url,
        banner_url: data.banner_url,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        culture_video_url: data.culture_video_url,
      },
    })
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({ error: 'Failed to get user' })
  }
})

module.exports = router
