# Technical Specification - Careers Page Builder

## Overview

This document outlines the technical architecture and design decisions for the Careers Page Builder, a web application that enables companies to create customized careers pages without writing code.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client (Browser)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              React Application (Vite)                │   │
│  │  ┌───────────┐  ┌───────────┐  ┌───────────────┐   │   │
│  │  │   Auth    │  │ Dashboard │  │ Public Pages  │   │   │
│  │  │  Context  │  │   Pages   │  │               │   │   │
│  │  └───────────┘  └───────────┘  └───────────────┘   │   │
│  └─────────────────────────────────────────────────────┘   │
└────────────────────────────┬────────────────────────────────┘
                             │
                             │ HTTPS / WebSocket
                             │
┌────────────────────────────▼────────────────────────────────┐
│                       Supabase                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Auth      │  │  Database   │  │      Storage        │  │
│  │  (Users)    │  │ (PostgreSQL)│  │  (company-assets)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
App
├── AuthProvider
│   └── AppRoutes
│       ├── Auth Pages
│       │   └── Login
│       ├── Dashboard (Protected)
│       │   ├── Editor
│       │   │   ├── BrandingEditor
│       │   │   └── SectionManager
│       │   │       └── SortableSection (DnD)
│       │   ├── Preview
│       │   │   └── CareersPreview
│       │   └── JobsManager
│       │       └── JobForm
│       └── Public
│           └── CareersPage
```

## Data Model

### Entity Relationship Diagram

```
┌───────────────────┐          1          ┌────────────────────┐
│     companies     │────────────────────▶│     recruiters     │
│                   │       (one-to-many) │                    │
│  id (PK)          │                     │  id (PK, FK)       │
│  slug (unique)    │                     │  company_id (FK)   │
│  name             │                     │  email             │
│  logo_url         │                     │  name              │
│  banner_url       │                     └────────────────────┘
│  primary_color    │
│  secondary_color  │
│  culture_video_url│
└───────────────────┘
          │
          │ 1
          │
          ▼
┌───────────────────┐                     ┌────────────────────┐
│  careers_sections │                     │        jobs        │
│                   │                     │                    │
│  id (PK)          │                     │  id (PK)           │
│  company_id (FK)  │◀───────────────────▶│  company_id (FK)   │
│  type             │     (one-to-many)   │  title             │
│  title            │                     │  description       │
│  content          │                     │  location          │
│  media_url        │                     │  job_type          │
│  order_index      │                     │  department        │
│  is_visible       │                     │  salary_range      │
└───────────────────┘                     │  requirements      │
                                          │  is_active         │
                                          └────────────────────┘
```

### Table Specifications

#### companies
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| slug | TEXT | UNIQUE, NOT NULL | URL-friendly identifier |
| name | TEXT | NOT NULL | Company display name |
| logo_url | TEXT | NULLABLE | URL to logo image |
| banner_url | TEXT | NULLABLE | URL to banner image |
| primary_color | TEXT | DEFAULT '#3B82F6' | Primary brand color (hex) |
| secondary_color | TEXT | DEFAULT '#1E40AF' | Secondary brand color (hex) |
| culture_video_url | TEXT | NULLABLE | URL to culture video |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

#### recruiters
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, FK → auth.users | Links to Supabase Auth |
| company_id | UUID | FK → companies | Associated company |
| email | TEXT | NOT NULL | Recruiter email |
| name | TEXT | NULLABLE | Recruiter name |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |

#### careers_sections
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| company_id | UUID | FK → companies | Associated company |
| type | TEXT | CHECK constraint | Section type enum |
| title | TEXT | NOT NULL | Section heading |
| content | TEXT | NULLABLE | Section body content |
| media_url | TEXT | NULLABLE | Associated media URL |
| order_index | INTEGER | NOT NULL, DEFAULT 0 | Display order |
| is_visible | BOOLEAN | DEFAULT true | Visibility toggle |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

#### jobs
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| company_id | UUID | FK → companies | Associated company |
| title | TEXT | NOT NULL | Job title |
| description | TEXT | NULLABLE | Job description |
| location | TEXT | NULLABLE | Job location |
| job_type | TEXT | CHECK constraint | Employment type |
| department | TEXT | NULLABLE | Department name |
| salary_range | TEXT | NULLABLE | Salary information |
| requirements | TEXT | NULLABLE | Job requirements |
| is_active | BOOLEAN | DEFAULT true | Published status |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

## Security

### Row Level Security (RLS)

All tables have RLS enabled with the following policies:

1. **companies**:
   - Recruiters can read/update their own company
   - Public can read all companies (for careers pages)

2. **recruiters**:
   - Users can only read/update their own profile

3. **careers_sections**:
   - Recruiters can CRUD sections for their company
   - Public can read visible sections only

4. **jobs**:
   - Recruiters can CRUD jobs for their company
   - Public can read active jobs only

### Authentication Flow

1. User logs in with email/password
2. Backend validates credentials against database
3. JWT token issued and stored in localStorage
4. Protected routes check auth state via AuthContext

## Key Technical Decisions

### Why Vite + React?
- Fast development with HMR
- Modern build tooling
- Easy deployment to static hosts

### Why Supabase?
- PostgreSQL with RLS for security
- Built-in authentication
- Real-time capabilities (future use)
- File storage for assets
- Generous free tier

### Why Tailwind CSS v4?
- Utility-first for rapid UI development
- New Vite plugin integration
- Smaller bundle size
- No config file needed

### Why @dnd-kit?
- Modern React DnD library
- Accessible by default
- Lightweight
- TypeScript support

## Performance Considerations

1. **Code Splitting**: Routes are not lazy-loaded in this version but can be added for larger apps
2. **Image Optimization**: Recommended to use optimized images in Supabase Storage
3. **Database Indexes**: Created on frequently queried columns (slug, company_id, is_active)

## Future Enhancements

1. Rich text editor for section content
2. Job application form and tracking
3. Analytics dashboard
4. Email notifications
5. Custom domains for careers pages
6. A/B testing for page layouts
