# Careers Page Builder

A mini ATS (Applicant Tracking System) that allows companies to create and customize their own branded careers pages.

## Features

### Recruiter Dashboard
- **Branding Customization**: Upload logo, banner, and culture video
- **Color Theming**: Set primary and secondary brand colors
- **Section Management**: Add, edit, reorder, and toggle visibility of content sections
- **Drag & Drop**: Reorder sections with intuitive drag and drop
- **Job Management**: Create, edit, activate/deactivate job listings
- **Live Preview**: Preview how the careers page looks across devices

### Public Careers Page
- **Company Branding**: Displays company logo, banner, and colors
- **Content Sections**: About Us, Mission, Values, Culture, etc.
- **Job Listings**: Browse all active positions
- **Search & Filter**: Search jobs by title, filter by location and job type
- **Responsive Design**: Mobile-friendly layout
- **SEO Ready**: Proper meta tags and semantic HTML

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **File Storage**: Supabase Storage
- **Drag & Drop**: @dnd-kit
- **Icons**: Lucide React
- **Routing**: React Router v7

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd whitecarrot
```

2. Install dependencies:
```bash
npm install
```

3. Create a Supabase project at [supabase.com](https://supabase.com)

4. Run the database schema:
   - Go to your Supabase dashboard > SQL Editor
   - Copy and run the contents of `supabase/schema.sql`

5. Create a storage bucket:
   - Go to Storage in Supabase dashboard
   - Create a bucket named `company-assets`
   - Set it to public

6. Configure environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your Supabase credentials:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

7. Start the development server:
```bash
npm run dev
```

## Project Structure

```
src/
├── components/
│   ├── common/          # Shared components (ProtectedRoute, etc.)
│   ├── editor/          # Dashboard editor components
│   ├── preview/         # Preview components
│   └── public/          # Public page components
├── contexts/            # React contexts (Auth)
├── hooks/               # Custom React hooks
├── lib/                 # Third-party configs (Supabase)
├── pages/
│   ├── auth/            # Login
│   ├── dashboard/       # Editor, Preview, Jobs
│   └── public/          # CareersPage
└── utils/               # Helper functions
```

## Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/login` | Recruiter login | Public |
| `/:companySlug/edit` | Dashboard editor | Protected |
| `/:companySlug/preview` | Preview mode | Protected |
| `/:companySlug/jobs` | Job management | Protected |
| `/:companySlug/careers` | Public careers page | Public |

## Database Schema

### Tables
- **companies**: Company profile and branding
- **recruiters**: Recruiter profiles linked to auth.users
- **careers_sections**: Content sections for careers page
- **jobs**: Job listings

See `supabase/schema.sql` for full schema with RLS policies.

## Deployment

### Vercel
1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Build Command
```bash
npm run build
```

## License

MIT
