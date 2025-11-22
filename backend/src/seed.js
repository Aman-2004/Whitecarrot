/**
 * Seed script for sample data
 * Based on: https://docs.google.com/spreadsheets/d/16HRj1fHXuq10AxU-RtC6Qd1KBODsqvO4J4v3i1qGcD0
 *
 * Run: node src/seed.js
 */

require('dotenv').config()
const bcrypt = require('bcrypt')
const pool = require('./config/db')

const sampleCompanies = [
  {
    name: 'TechCorp Solutions',
    slug: 'techcorp',
    primary_color: '#2563EB',
    secondary_color: '#1E40AF',
  },
  {
    name: 'GreenEnergy Inc',
    slug: 'greenenergy',
    primary_color: '#059669',
    secondary_color: '#047857',
  },
]

const sampleRecruiters = [
  {
    email: 'recruiter@techcorp.com',
    password: 'password123',
    name: 'John Smith',
    companySlug: 'techcorp',
  },
  {
    email: 'hr@greenenergy.com',
    password: 'password123',
    name: 'Jane Doe',
    companySlug: 'greenenergy',
  },
]

const sampleSections = [
  // TechCorp sections
  {
    companySlug: 'techcorp',
    type: 'about',
    title: 'About TechCorp',
    content: 'TechCorp Solutions is a leading technology company specializing in innovative software solutions for enterprise clients worldwide.\n\nFounded in 2010, we have grown from a small startup to a global leader with over 500 employees across 10 countries. Our mission is to empower businesses with cutting-edge technology that drives growth and efficiency.',
    order_index: 0,
  },
  {
    companySlug: 'techcorp',
    type: 'values',
    title: 'Our Values',
    content: 'Innovation - We constantly push boundaries and embrace new ideas.\n\nIntegrity - We act with honesty and transparency in everything we do.\n\nCollaboration - We believe the best results come from working together.\n\nExcellence - We strive for the highest quality in our work.',
    order_index: 1,
  },
  {
    companySlug: 'techcorp',
    type: 'benefits',
    title: 'Benefits & Perks',
    content: 'Competitive salary and equity packages\n\nComprehensive health, dental, and vision insurance\n\nFlexible work arrangements and remote options\n\nUnlimited PTO policy\n\nProfessional development budget\n\nFree lunch and snacks',
    order_index: 2,
  },
  // GreenEnergy sections
  {
    companySlug: 'greenenergy',
    type: 'about',
    title: 'About GreenEnergy',
    content: 'GreenEnergy Inc is on a mission to accelerate the world\'s transition to sustainable energy.\n\nWe design, manufacture, and install solar panels, wind turbines, and energy storage solutions for residential and commercial customers.',
    order_index: 0,
  },
  {
    companySlug: 'greenenergy',
    type: 'mission',
    title: 'Our Mission',
    content: 'To make clean energy accessible and affordable for everyone.\n\nWe believe that sustainable energy is not just good for the planet - it\'s good for business. Our goal is to help organizations reduce their carbon footprint while saving money on energy costs.',
    order_index: 1,
  },
]

// Sample jobs data from the Google Sheet
const sampleJobs = [
  // TechCorp Jobs
  {
    companySlug: 'techcorp',
    title: 'Senior Software Engineer',
    description: 'We are looking for a Senior Software Engineer to join our growing team. You will be responsible for designing and implementing scalable backend services.',
    location: 'San Francisco, CA',
    job_type: 'full-time',
    department: 'Engineering',
    salary_range: '$150,000 - $200,000',
    requirements: 'Experience with Node.js, Python, or Go\nStrong understanding of distributed systems\n5+ years of software development experience',
    is_active: true,
  },
  {
    companySlug: 'techcorp',
    title: 'Product Manager',
    description: 'Lead product strategy and roadmap for our enterprise suite. Work closely with engineering, design, and sales teams.',
    location: 'New York, NY',
    job_type: 'full-time',
    department: 'Product',
    salary_range: '$130,000 - $170,000',
    requirements: '3+ years of product management experience\nStrong analytical and communication skills\nExperience with B2B SaaS products',
    is_active: true,
  },
  {
    companySlug: 'techcorp',
    title: 'UX Designer',
    description: 'Create intuitive and beautiful user experiences for our products. Conduct user research and create wireframes and prototypes.',
    location: 'Remote',
    job_type: 'full-time',
    department: 'Design',
    salary_range: '$100,000 - $140,000',
    requirements: 'Portfolio demonstrating UX/UI design skills\nExperience with Figma or Sketch\n3+ years of design experience',
    is_active: true,
  },
  {
    companySlug: 'techcorp',
    title: 'DevOps Engineer',
    description: 'Build and maintain our cloud infrastructure. Implement CI/CD pipelines and ensure high availability of our services.',
    location: 'San Francisco, CA',
    job_type: 'full-time',
    department: 'Engineering',
    salary_range: '$140,000 - $180,000',
    requirements: 'Experience with AWS or GCP\nKubernetes and Docker expertise\nInfrastructure as Code (Terraform)',
    is_active: true,
  },
  {
    companySlug: 'techcorp',
    title: 'Marketing Intern',
    description: 'Support our marketing team with content creation, social media management, and campaign analysis.',
    location: 'New York, NY',
    job_type: 'internship',
    department: 'Marketing',
    salary_range: '$25/hour',
    requirements: 'Currently pursuing a degree in Marketing or related field\nStrong writing skills\nFamiliarity with social media platforms',
    is_active: true,
  },
  // GreenEnergy Jobs
  {
    companySlug: 'greenenergy',
    title: 'Solar Installation Technician',
    description: 'Install solar panel systems for residential and commercial customers. Ensure quality and safety standards.',
    location: 'Austin, TX',
    job_type: 'full-time',
    department: 'Operations',
    salary_range: '$50,000 - $70,000',
    requirements: 'OSHA certification\nExperience with electrical systems\nPhysical ability to work on roofs',
    is_active: true,
  },
  {
    companySlug: 'greenenergy',
    title: 'Energy Consultant',
    description: 'Help customers understand their energy needs and recommend appropriate solutions. Conduct energy audits.',
    location: 'Denver, CO',
    job_type: 'full-time',
    department: 'Sales',
    salary_range: '$60,000 - $90,000 + commission',
    requirements: 'Sales experience preferred\nKnowledge of renewable energy systems\nExcellent communication skills',
    is_active: true,
  },
  {
    companySlug: 'greenenergy',
    title: 'Electrical Engineer',
    description: 'Design electrical systems for solar and wind installations. Work with the R&D team on new products.',
    location: 'Boston, MA',
    job_type: 'full-time',
    department: 'Engineering',
    salary_range: '$90,000 - $130,000',
    requirements: 'PE license preferred\nExperience with power systems\nCAD software proficiency',
    is_active: true,
  },
  {
    companySlug: 'greenenergy',
    title: 'Part-Time Customer Support',
    description: 'Provide phone and email support to customers. Answer questions about installations and billing.',
    location: 'Remote',
    job_type: 'part-time',
    department: 'Support',
    salary_range: '$20/hour',
    requirements: 'Excellent communication skills\nPatience and problem-solving ability\nBasic computer skills',
    is_active: true,
  },
  {
    companySlug: 'greenenergy',
    title: 'Project Manager',
    description: 'Manage large-scale commercial solar installations. Coordinate with customers, contractors, and internal teams.',
    location: 'Los Angeles, CA',
    job_type: 'contract',
    department: 'Operations',
    salary_range: '$80,000 - $110,000',
    requirements: 'PMP certification preferred\nExperience in construction or energy projects\nStrong organizational skills',
    is_active: true,
  },
]

async function seed() {
  console.log('Starting seed...')

  try {
    // Create companies
    const companyMap = {}
    for (const company of sampleCompanies) {
      const existing = await pool.query('SELECT id FROM companies WHERE slug = $1', [company.slug])
      if (existing.rows.length > 0) {
        console.log(`Company ${company.slug} already exists, skipping...`)
        companyMap[company.slug] = existing.rows[0].id
        continue
      }

      const result = await pool.query(
        `INSERT INTO companies (name, slug, primary_color, secondary_color)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [company.name, company.slug, company.primary_color, company.secondary_color]
      )
      companyMap[company.slug] = result.rows[0].id
      console.log(`Created company: ${company.name}`)
    }

    // Create recruiters
    for (const recruiter of sampleRecruiters) {
      const existing = await pool.query('SELECT id FROM recruiters WHERE email = $1', [recruiter.email])
      if (existing.rows.length > 0) {
        console.log(`Recruiter ${recruiter.email} already exists, skipping...`)
        continue
      }

      const passwordHash = await bcrypt.hash(recruiter.password, 10)
      await pool.query(
        `INSERT INTO recruiters (email, password_hash, name, company_id)
         VALUES ($1, $2, $3, $4)`,
        [recruiter.email, passwordHash, recruiter.name, companyMap[recruiter.companySlug]]
      )
      console.log(`Created recruiter: ${recruiter.email}`)
    }

    // Create sections
    for (const section of sampleSections) {
      const companyId = companyMap[section.companySlug]
      const existing = await pool.query(
        'SELECT id FROM careers_sections WHERE company_id = $1 AND title = $2',
        [companyId, section.title]
      )
      if (existing.rows.length > 0) {
        console.log(`Section "${section.title}" already exists, skipping...`)
        continue
      }

      await pool.query(
        `INSERT INTO careers_sections (company_id, type, title, content, order_index, is_visible)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [companyId, section.type, section.title, section.content, section.order_index]
      )
      console.log(`Created section: ${section.title}`)
    }

    // Create jobs
    for (const job of sampleJobs) {
      const companyId = companyMap[job.companySlug]
      const existing = await pool.query(
        'SELECT id FROM jobs WHERE company_id = $1 AND title = $2',
        [companyId, job.title]
      )
      if (existing.rows.length > 0) {
        console.log(`Job "${job.title}" already exists, skipping...`)
        continue
      }

      await pool.query(
        `INSERT INTO jobs (company_id, title, description, location, job_type, department, salary_range, requirements, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [companyId, job.title, job.description, job.location, job.job_type, job.department, job.salary_range, job.requirements, job.is_active]
      )
      console.log(`Created job: ${job.title}`)
    }

    console.log('\nSeed completed successfully!')
    console.log('\nSample login credentials:')
    console.log('---')
    for (const recruiter of sampleRecruiters) {
      console.log(`Email: ${recruiter.email}`)
      console.log(`Password: ${recruiter.password}`)
      console.log(`Company: ${recruiter.companySlug}`)
      console.log('---')
    }
  } catch (error) {
    console.error('Seed error:', error)
  } finally {
    await pool.end()
  }
}

seed()
