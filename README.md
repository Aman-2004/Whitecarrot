# Careers Page Builder

A mini ATS that enables companies to create branded, customizable careers pages with drag-and-drop sections and job listings.

---

## How to Run

### Prerequisites
- Node.js 18+
- npm
- Supabase account (free tier works)

### 1. Clone & Setup Supabase

```bash
git clone <repository-url>
cd whitecarrot
```

**Database Setup:**
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste contents of `supabase/schema.sql` → Run

**Storage Setup:**
1. Go to **Storage** → **New Bucket**
2. Name: `company-assets` → Enable **Public bucket** → Create

**Get Credentials** (Settings → API):
- Project URL
- anon public key
- service_role key
- Connection string (Settings → Database)

### 2. Run Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT-ID].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[SERVICE-ROLE-KEY]
JWT_SECRET=your-random-secret-key
PORT=3000
FRONTEND_URL=http://localhost:5173
```

```bash
npm run dev
```

### 3. Run Frontend

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `frontend/.env`:
```env
VITE_SUPABASE_URL=https://[PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=[ANON-PUBLIC-KEY]
VITE_API_URL=http://localhost:3000/api
```

```bash
npm run dev
```

### 4. Seed Test Data (Optional)

```bash
cd backend && node src/seed.js
```

**Test Credentials:**
| Email | Password | Company |
|-------|----------|---------|
| sarah@techcorp.com | password123 | TechCorp |
| mike@techcorp.com | password123 | TechCorp |
| alex@startupxyz.com | password123 | StartupXYZ |

### URLs
- Login: http://localhost:5173/login
- Editor: http://localhost:5173/techcorp/edit
- Public Page: http://localhost:5173/techcorp/careers

---

## What I Built

### Recruiter Features

**Brand Customization:**
- Upload company logo, banner image, and culture video
- Set primary/secondary brand colors
- Instant preview with image compression for faster uploads

**Content Sections:**
- Add sections: About, Mission, Values, Culture, Life, Benefits, Custom
- Drag-and-drop reordering
- Toggle visibility without deleting
- Edit/delete sections

**Preview Mode:**
- Desktop, Tablet, Mobile viewport testing
- View live public page

**Per-Company Data:**
- Each company has isolated data
- Multiple recruiters per company
- Company-specific URL slugs

### Candidate Features

**Company Information:**
- View branding (logo, banner, colors)
- Read content sections
- Watch culture video

**Job Browsing:**
- Job cards with title, department, location, type, salary
- Real-time search (title + description)
- Filter by location and job type
- Clear all filters

**Responsive Design:**
- Mobile-friendly layout
- Touch-friendly navigation
- Collapsible filters on mobile

**SEO Optimization:**
- Dynamic meta tags (title, description)
- Open Graph & Twitter Cards
- JSON-LD structured data for Google Jobs
- Semantic HTML with proper heading hierarchy

---

## Step-by-Step User Guide

### For Recruiters

**1. Login**
- Navigate to `/login` → Enter email & password → Sign In

**2. Customize Branding** (Branding tab)
- **Logo**: Click "Upload Logo" → Select image → Auto-compresses & uploads
- **Banner**: Click "Upload Banner" → Select wide image (1920x400 recommended)
- **Video**: Click "Upload Video" → Select MP4 (max 50MB)
- **Colors**: Pick primary/secondary colors → Click "Save Colors"

**3. Manage Sections** (Sections tab)
- **Add**: Click "Add Section" → Select type → Enter title & content → Save
- **Edit**: Click pencil icon → Modify → Save
- **Reorder**: Drag using handle (six dots) → Drop in position
- **Hide/Show**: Click eye icon
- **Delete**: Click trash icon

**4. Preview**
- Click "Preview" in nav bar
- Test Desktop/Tablet/Mobile views
- Click "View Live Page" to open public URL

**5. Share**
- Copy URL: `yourdomain.com/{company-slug}/careers`
- Share on website, social media, job boards

### For Candidates

**1. Visit Careers Page**
- Open the company's careers URL (no login needed)

**2. Explore Company**
- View banner, logo, brand colors
- Read content sections (About, Mission, Values, etc.)
- Watch culture video if available

**3. Browse Jobs**
- Scroll to "Open Positions" section
- **Search**: Type keywords in search box (filters instantly)
- **Filter by Location**: Select from dropdown
- **Filter by Job Type**: Select Full-time, Part-time, Contract, etc.
- **Clear Filters**: Click "Clear" button to reset

**4. Apply**
- Click "Apply Now" on job card

---

## Improvement Plan

### API Improvements

| Improvement | Solution |
|-------------|----------|
| Rate Limiting | Install `express-rate-limit`. Add limiters: login (5/15min), uploads (10/hour), API (100/min) |
| Pagination | Add `page` & `limit` query params to jobs endpoint. Return `{ data, total, totalPages }` |
| Caching | Use Redis for public endpoints. Set 1-hour TTL, invalidate on updates |
| Error Handling | Create centralized error middleware. Standardize format: `{ success, data/error }` |
| Request Logging | Use Winston logger. Log method, path, status, duration for all requests |

### Frontend Improvements

| Improvement | Solution |
|-------------|----------|
| Code Splitting | Use `React.lazy()` for routes (Login, Editor, Preview, CareersPage) with Suspense |
| Loading Skeletons | Create skeleton components for sections list, job cards, branding preview |
| Error Boundaries | Wrap routes in ErrorBoundary component to catch render errors gracefully |
| Form Validation | Add inline validation with error messages for login, section editor forms |
| Image Optimization | Add `loading="lazy"` and `decoding="async"` to all images |


### Security Improvements

| Improvement | Solution |
|-------------|----------|
| XSS Prevention | Install `dompurify`. Sanitize user-generated content before rendering |
| File Upload Validation | Validate MIME types. Whitelist: logo (png/jpg), banner (jpg/png), video (mp4) |
| JWT Validation | Validate JWT_SECRET exists and is 32+ chars in production on startup |
| CORS Config | Support multiple origins via comma-separated `ALLOWED_ORIGINS` env var |


### Features to Add

| Feature | Description |
|---------|-------------|
| Job Applications | Application form with resume upload (PDF/DOCX), recruiter dashboard to review |
| Rich Text Editor | WYSIWYG for section content using TipTap/Slate (bold, lists, links) |
| Image Gallery | Multiple images per section with lightbox view |
| Analytics Dashboard | Track page views, job clicks, application rates with charts |
