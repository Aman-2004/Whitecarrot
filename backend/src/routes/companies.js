const express = require('express')
const { z } = require('zod')
const multer = require('multer')
const pool = require('../config/db')
const supabase = require('../config/supabase')
const auth = require('../middleware/auth')

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
})

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

// Upload file (logo, banner, or culture video)
router.post('/:id/upload', auth, upload.single('file'), async (req, res) => {
  const { id } = req.params
  const { type } = req.body // 'logo', 'banner', or 'culture_video'

  // Validate UUID
  const uuidSchema = z.string().uuid()
  const idValidation = uuidSchema.safeParse(id)
  if (!idValidation.success) {
    return res.status(400).json({ error: 'Invalid company ID' })
  }

  // Check authorization
  if (req.user.company_id !== id) {
    return res.status(403).json({ error: 'Not authorized' })
  }

  // Validate type
  const validTypes = ['logo', 'banner', 'culture_video']
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid upload type. Must be logo, banner, or culture_video' })
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' })
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Storage not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' })
  }

  try {
    const fileExt = req.file.originalname.split('.').pop()
    const fileName = `${id}/${type}-${Date.now()}.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('company-assets')
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return res.status(500).json({ error: 'Failed to upload file to storage' })
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('company-assets')
      .getPublicUrl(fileName)

    // Update company record
    const updateField = type === 'logo' ? 'logo_url' : type === 'banner' ? 'banner_url' : 'culture_video_url'
    const result = await pool.query(
      `UPDATE companies SET ${updateField} = $1 WHERE id = $2 RETURNING *`,
      [publicUrl, id]
    )

    res.json({ url: publicUrl, company: result.rows[0] })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Failed to upload file' })
  }
})

module.exports = router
