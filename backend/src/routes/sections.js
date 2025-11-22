const express = require('express')
const { z } = require('zod')
const pool = require('../config/db')
const auth = require('../middleware/auth')

const router = express.Router()

// Validation schemas
const uuidSchema = z.string().uuid('Invalid UUID format')

const sectionTypeEnum = z.enum(['about', 'mission', 'values', 'culture', 'life', 'benefits', 'custom'])

const createSectionSchema = z.object({
  company_id: z.string().uuid('Invalid company ID'),
  type: sectionTypeEnum,
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().max(10000).optional().default(''),
  media_url: z.string().url().nullable().optional(),
  order_index: z.number().int().min(0).optional().default(0),
  is_visible: z.boolean().optional().default(true),
})

const updateSectionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().max(10000).optional(),
  media_url: z.string().url().nullable().optional(),
  order_index: z.number().int().min(0).optional(),
  is_visible: z.boolean().optional(),
})

const bulkOrderSchema = z.object({
  sections: z.array(z.object({
    id: z.string().uuid(),
    order_index: z.number().int().min(0),
  })).min(1, 'At least one section required'),
})

// Get sections by company (public - only visible ones)
router.get('/public/:companyId', async (req, res) => {
  const validation = uuidSchema.safeParse(req.params.companyId)
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid company ID' })
  }

  try {
    const result = await pool.query(
      `SELECT * FROM careers_sections
       WHERE company_id = $1 AND is_visible = true
       ORDER BY order_index`,
      [validation.data]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Get public sections error:', error)
    res.status(500).json({ error: 'Failed to get sections' })
  }
})

// Get all sections (protected - for editing)
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
      'SELECT * FROM careers_sections WHERE company_id = $1 ORDER BY order_index',
      [validation.data]
    )
    res.json(result.rows)
  } catch (error) {
    console.error('Get sections error:', error)
    res.status(500).json({ error: 'Failed to get sections' })
  }
})

// Create section (protected)
router.post('/', auth, async (req, res) => {
  // Validate body
  const validation = createSectionSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    })
  }

  const { company_id, type, title, content, media_url, order_index, is_visible } = validation.data

  // Check authorization
  if (req.user.company_id !== company_id) {
    return res.status(403).json({ error: 'Not authorized' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO careers_sections (company_id, type, title, content, media_url, order_index, is_visible)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [company_id, type, title, content, media_url, order_index, is_visible]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Create section error:', error)
    res.status(500).json({ error: 'Failed to create section' })
  }
})

// Update section (protected)
router.put('/:id', auth, async (req, res) => {
  // Validate params
  const idValidation = uuidSchema.safeParse(req.params.id)
  if (!idValidation.success) {
    return res.status(400).json({ error: 'Invalid section ID' })
  }

  // Validate body
  const validation = updateSectionSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    })
  }

  const { title, content, media_url, order_index, is_visible } = validation.data
  const id = idValidation.data

  try {
    // Get section to check ownership
    const sectionResult = await pool.query(
      'SELECT company_id FROM careers_sections WHERE id = $1',
      [id]
    )

    if (sectionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Section not found' })
    }

    if (sectionResult.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const result = await pool.query(
      `UPDATE careers_sections
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           media_url = $3,
           order_index = COALESCE($4, order_index),
           is_visible = COALESCE($5, is_visible)
       WHERE id = $6
       RETURNING *`,
      [title, content, media_url, order_index, is_visible, id]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error('Update section error:', error)
    res.status(500).json({ error: 'Failed to update section' })
  }
})

// Bulk update sections order (protected)
router.put('/bulk/order', auth, async (req, res) => {
  // Validate body
  const validation = bulkOrderSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    })
  }

  const { sections } = validation.data

  try {
    for (const section of sections) {
      // Verify ownership
      const checkResult = await pool.query(
        'SELECT company_id FROM careers_sections WHERE id = $1',
        [section.id]
      )

      if (checkResult.rows.length > 0 && checkResult.rows[0].company_id === req.user.company_id) {
        await pool.query(
          'UPDATE careers_sections SET order_index = $1 WHERE id = $2',
          [section.order_index, section.id]
        )
      }
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Bulk update sections error:', error)
    res.status(500).json({ error: 'Failed to update sections' })
  }
})

// Delete section (protected)
router.delete('/:id', auth, async (req, res) => {
  // Validate params
  const validation = uuidSchema.safeParse(req.params.id)
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid section ID' })
  }

  const id = validation.data

  try {
    // Check ownership
    const sectionResult = await pool.query(
      'SELECT company_id FROM careers_sections WHERE id = $1',
      [id]
    )

    if (sectionResult.rows.length === 0) {
      return res.status(404).json({ error: 'Section not found' })
    }

    if (sectionResult.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await pool.query('DELETE FROM careers_sections WHERE id = $1', [id])
    res.json({ success: true })
  } catch (error) {
    console.error('Delete section error:', error)
    res.status(500).json({ error: 'Failed to delete section' })
  }
})

module.exports = router
