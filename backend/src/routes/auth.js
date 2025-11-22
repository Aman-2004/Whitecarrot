const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { z } = require('zod')
const pool = require('../config/db')
const auth = require('../middleware/auth')

const router = express.Router()

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  companyName: z.string().min(1, 'Company name is required').max(100),
  companySlug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(50)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
})

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Register
router.post('/register', async (req, res) => {
  // Validate input
  const validation = registerSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    })
  }

  const { name, email, password, companyName, companySlug } = validation.data

  try {
    // Check if email exists
    const existingUser = await pool.query(
      'SELECT id FROM recruiters WHERE email = $1',
      [email]
    )

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' })
    }

    // Check if slug exists
    const existingSlug = await pool.query(
      'SELECT id FROM companies WHERE slug = $1',
      [companySlug.toLowerCase()]
    )

    if (existingSlug.rows.length > 0) {
      return res.status(400).json({ error: 'Company slug already taken' })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create company
    const companyResult = await pool.query(
      `INSERT INTO companies (name, slug) VALUES ($1, $2) RETURNING *`,
      [companyName, companySlug.toLowerCase().replace(/[^a-z0-9-]/g, '-')]
    )
    const company = companyResult.rows[0]

    // Create recruiter
    const recruiterResult = await pool.query(
      `INSERT INTO recruiters (email, password_hash, name, company_id)
       VALUES ($1, $2, $3, $4) RETURNING id, email, name, company_id`,
      [email, passwordHash, name, company.id]
    )
    const recruiter = recruiterResult.rows[0]

    // Create default sections
    const defaultSections = [
      { type: 'about', title: 'About Us', content: 'Tell your company story...', order_index: 0 },
      { type: 'mission', title: 'Our Mission', content: 'What drives us...', order_index: 1 },
      { type: 'values', title: 'Our Values', content: 'What we believe in...', order_index: 2 },
    ]

    for (const section of defaultSections) {
      await pool.query(
        `INSERT INTO careers_sections (company_id, type, title, content, order_index)
         VALUES ($1, $2, $3, $4, $5)`,
        [company.id, section.type, section.title, section.content, section.order_index]
      )
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: recruiter.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    res.status(201).json({
      token,
      user: {
        id: recruiter.id,
        email: recruiter.email,
        name: recruiter.name,
      },
      company: {
        id: company.id,
        name: company.name,
        slug: company.slug,
      },
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({ error: 'Registration failed' })
  }
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
