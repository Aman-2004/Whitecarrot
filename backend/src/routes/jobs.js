const express = require('express')
const { z } = require('zod')
const pool = require('../config/db')
const auth = require('../middleware/auth')

const router = express.Router()

// Validation schemas
const uuidSchema = z.string().uuid('Invalid UUID format')

const jobTypeEnum = z.enum(['full-time', 'part-time', 'contract', 'internship', 'remote'])

const createJobSchema = z.object({
  company_id: z.string().uuid('Invalid company ID'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(10000).optional(),
  location: z.string().max(100).optional(),
  job_type: jobTypeEnum.optional(),
  department: z.string().max(100).optional(),
  salary_range: z.string().max(100).optional(),
  requirements: z.string().max(10000).optional(),
  is_active: z.boolean().optional().default(true),
})

const updateJobSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10000).nullable().optional(),
  location: z.string().max(100).nullable().optional(),
  job_type: jobTypeEnum.nullable().optional(),
  department: z.string().max(100).nullable().optional(),
  salary_range: z.string().max(100).nullable().optional(),
  requirements: z.string().max(10000).nullable().optional(),
  is_active: z.boolean().optional(),
})

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

// Create job (protected)
router.post('/', auth, async (req, res) => {
  // Validate body
  const validation = createJobSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    })
  }

  const {
    company_id,
    title,
    description,
    location,
    job_type,
    department,
    salary_range,
    requirements,
    is_active,
  } = validation.data

  // Check authorization
  if (req.user.company_id !== company_id) {
    return res.status(403).json({ error: 'Not authorized' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO jobs (company_id, title, description, location, job_type, department, salary_range, requirements, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [company_id, title, description, location, job_type, department, salary_range, requirements, is_active]
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('Create job error:', error)
    res.status(500).json({ error: 'Failed to create job' })
  }
})

// Update job (protected)
router.put('/:id', auth, async (req, res) => {
  // Validate params
  const idValidation = uuidSchema.safeParse(req.params.id)
  if (!idValidation.success) {
    return res.status(400).json({ error: 'Invalid job ID' })
  }

  // Validate body
  const validation = updateJobSchema.safeParse(req.body)
  if (!validation.success) {
    return res.status(400).json({
      error: 'Validation failed',
      details: validation.error.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    })
  }

  const {
    title,
    description,
    location,
    job_type,
    department,
    salary_range,
    requirements,
    is_active,
  } = validation.data
  const id = idValidation.data

  try {
    // Check ownership
    const jobResult = await pool.query(
      'SELECT company_id FROM jobs WHERE id = $1',
      [id]
    )

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' })
    }

    if (jobResult.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    const result = await pool.query(
      `UPDATE jobs
       SET title = COALESCE($1, title),
           description = $2,
           location = $3,
           job_type = $4,
           department = $5,
           salary_range = $6,
           requirements = $7,
           is_active = COALESCE($8, is_active)
       WHERE id = $9
       RETURNING *`,
      [title, description, location, job_type, department, salary_range, requirements, is_active, id]
    )

    res.json(result.rows[0])
  } catch (error) {
    console.error('Update job error:', error)
    res.status(500).json({ error: 'Failed to update job' })
  }
})

// Delete job (protected)
router.delete('/:id', auth, async (req, res) => {
  // Validate params
  const validation = uuidSchema.safeParse(req.params.id)
  if (!validation.success) {
    return res.status(400).json({ error: 'Invalid job ID' })
  }

  const id = validation.data

  try {
    // Check ownership
    const jobResult = await pool.query(
      'SELECT company_id FROM jobs WHERE id = $1',
      [id]
    )

    if (jobResult.rows.length === 0) {
      return res.status(404).json({ error: 'Job not found' })
    }

    if (jobResult.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await pool.query('DELETE FROM jobs WHERE id = $1', [id])
    res.json({ success: true })
  } catch (error) {
    console.error('Delete job error:', error)
    res.status(500).json({ error: 'Failed to delete job' })
  }
})

module.exports = router
