# Technical Specification

## Assumptions

### Business Assumptions
- Each company has one careers page with a unique slug (e.g., `/techcorp/careers`)
- Multiple recruiters can belong to one company and share access to the same data
- Candidates browse careers pages without authentication
- Job applications are handled externally (Apply Now redirects or future implementation)

### Technical Assumptions
- Node.js 18+ runtime environment
- PostgreSQL database (via Supabase)
- Single-region deployment (no geo-distribution)
- File uploads limited to: images (logo, banner) and videos (culture video)
- Maximum file sizes: images 500KB (after compression), videos 50MB
- JWT tokens expire after 7 days

### Security Assumptions
- Backend handles all authorization (Supabase RLS disabled)
- Passwords hashed with bcrypt (10 salt rounds)
- HTTPS required in production
- CORS restricted to frontend domain

---

## Architecture

### System Overview

**Request Flow:**
Frontend (React + Vite) → Backend (Express.js) → Supabase (PostgreSQL + Storage)

- Frontend runs on `localhost:5173`
- Backend runs on `localhost:3000`
- Database and file storage hosted on Supabase

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 19, Vite, TailwindCSS | SPA with responsive UI |
| State | React Query, Context API | Server state caching, auth state |
| Backend | Express.js, Node.js | REST API, JWT authentication |
| Database | PostgreSQL (Supabase) | Data persistence |
| Storage | Supabase Storage | File uploads (images, videos) |

### Data Flow

```
1. Auth Flow:
   Login → POST /api/auth/login → Verify credentials → Return JWT + company data

2. Protected Request:
   Request → Auth Middleware (verify JWT) → Route Handler → Database → Response

3. File Upload:
   Select file → Compress (frontend) → POST /api/companies/:id/upload
   → Upload to Supabase Storage → Save URL to DB → Return updated company
```

### Directory Structure

```
whitecarrot/
├── frontend/
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── common/       # ProtectedRoute, Layout
│   │   │   ├── editor/       # BrandingEditor, SectionManager
│   │   │   └── preview/      # CareersPreview
│   │   ├── contexts/         # AuthContext
│   │   ├── lib/              # API client, Supabase config
│   │   └── pages/            # Route pages
├── backend/
│   ├── src/
│   │   ├── routes/           # auth, companies, sections, jobs
│   │   ├── middleware/       # auth middleware
│   │   ├── config/           # database connection
│   │   └── index.js          # Express entry point
└── supabase/
    └── schema.sql            # Database schema
```

---

## Schema

### Entity Relationships

**One-to-Many Relationships:**
- `companies` (1) ← (N) `recruiters` — Each company has multiple recruiters
- `companies` (1) ← (N) `careers_sections` — Each company has multiple sections
- `companies` (1) ← (N) `jobs` — Each company has multiple job listings

**Foreign Keys:**
- `recruiters.company_id` → `companies.id`
- `careers_sections.company_id` → `companies.id`
- `jobs.company_id` → `companies.id`

### Table Definitions

**companies**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, auto-generated |
| slug | TEXT | UNIQUE, NOT NULL |
| name | TEXT | NOT NULL |
| logo_url | TEXT | nullable |
| banner_url | TEXT | nullable |
| primary_color | TEXT | default '#3B82F6' |
| secondary_color | TEXT | default '#1E40AF' |
| culture_video_url | TEXT | nullable |

**recruiters**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, auto-generated |
| company_id | UUID | FK → companies.id |
| email | TEXT | UNIQUE, NOT NULL |
| password_hash | TEXT | NOT NULL |
| name | TEXT | nullable |

**careers_sections**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, auto-generated |
| company_id | UUID | FK → companies.id |
| type | TEXT | CHECK: about, mission, values, culture, life, benefits, custom |
| title | TEXT | NOT NULL |
| content | TEXT | nullable |
| order_index | INTEGER | default 0 |
| is_visible | BOOLEAN | default true |

**jobs**
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, auto-generated |
| company_id | UUID | FK → companies.id |
| title | TEXT | NOT NULL |
| description | TEXT | nullable |
| location | TEXT | nullable |
| job_type | TEXT | CHECK: full-time, part-time, contract, internship, remote |
| department | TEXT | nullable |
| salary_range | TEXT | nullable |
| is_active | BOOLEAN | default true |

### Indexes
- `idx_companies_slug` - Fast company lookup by slug
- `idx_recruiters_email` - Fast login lookup
- `idx_sections_company` - Fast section retrieval per company
- `idx_jobs_active` - Fast active job filtering

---

## Test Plan

### Unit Tests

| Module | Test Cases |
|--------|------------|
| Auth | Valid login returns JWT, Invalid credentials return 401, Password hashing works |
| Companies | CRUD operations, Slug uniqueness, File upload updates correct field |
| Sections | Create/update/delete, Bulk order update, Visibility toggle |
| Jobs | CRUD operations, is_active filtering, Job type validation |

### Integration Tests

| Flow | Test Steps |
|------|------------|
| Login Flow | POST /auth/login → Verify JWT → GET /auth/me returns user |
| Branding Update | Login → Upload logo → Verify URL saved → Fetch shows new URL |
| Section Reorder | Create 3 sections → PUT /sections/bulk/order → Verify new order |
| Public Careers | GET /companies/:slug → GET /sections/public/:id → GET /jobs/public/:id |

### E2E Test Scenarios

| Scenario | Steps |
|----------|-------|
| Recruiter Onboarding | Login → Upload logo/banner → Set colors → Add sections → Preview |
| Section Management | Add section → Edit → Drag to reorder → Hide → Delete |
| Candidate Experience | Visit careers page → View sections → Search jobs → Filter by location |
| Responsive Design | Test at 375px (mobile), 768px (tablet), 1440px (desktop) |

### API Test Cases

```
# Auth
POST /api/auth/login     → Valid credentials → 200 + JWT
POST /api/auth/login     → Invalid password → 401
GET  /api/auth/me        → Valid JWT → 200 + user
GET  /api/auth/me        → No JWT → 401

# Companies
GET  /api/companies/:slug → Exists → 200
PUT  /api/companies/:id   → Authorized → 200
PUT  /api/companies/:id   → Unauthorized → 403

# Sections
GET  /api/sections/public/:companyId → Returns visible only
PUT  /api/sections/bulk/order        → Updates all order_index

# Jobs
GET  /api/jobs/public/:companyId → Returns active only
POST /api/jobs                   → Creates for user's company
```

