const express = require('express')
const { z } = require('zod')
const pool = require('../config/db')
const auth = require('../middleware/auth')

const router = express.Router()

// Validation schemas
const slugParamSchema = z.object({
  slug: z.string().min(1).max(50),
})

const updateCompanySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  logo_url: z.string().url().nullable().optional(),
  banner_url: z.string().url().nullable().optional(),
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
  culture_video_url: z.string().url().nullable().optional(),
})

// Get company by slug (public)
router.get('/slug/:slug', async (req, res) => {
  // Validate params
  const validation = slugParamSchema.safeParse(req.params)
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid slug' })
  }

  try {
    const result = await pool.query(
      'SELECT * FROM companies WHERE slug = $1',
      [validation.data.slug]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Company not found' })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error('Get company error:', error)
    res.status(500).json({ error: 'Failed to get company' })
  }
})

// Update company (protected)
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params

  // Validate UUID format
  const uuidSchema = z.string().uuid()
  const idValidation = uuidSchema.safeParse(id)
  if (!idValidation.success) {
    return res.status(400).json({ error: 'Invalid company ID' })
  }

  // Check authorization
  if (req.user.company_id !== id) {
    return res.status(403).json({ error: 'Not authorized' })
  }

  // Validate body
  const validation = updateCompanySchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    })
  }

  const {
    name,
    logo_url,
    banner_url,
    primary_color,
    secondary_color,
    culture_video_url,
  } = validation.data

  try {
    const result = await pool.query(
      `UPDATE companies
       SET name = COALESCE($1, name),
           logo_url = COALESCE($2, logo_url),
           banner_url = COALESCE($3, banner_url),
           primary_color = COALESCE($4, primary_color),
           secondary_color = COALESCE($5, secondary_color),
           culture_video_url = COALESCE($6, culture_video_url)
       WHERE id = $7
       RETURNING *`,
      [name, logo_url, banner_url, primary_color, secondary_color, culture_video_url, id]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error('Update company error:', error)
    res.status(500).json({ error: 'Failed to update company' })
  }
})

module.exports = router
