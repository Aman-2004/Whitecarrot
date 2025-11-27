# Agent Log

Notes on how I used AI (Claude Code) during development.

## Code Understanding

- Asked about useMemo hooks in CareersPage - for filtering jobs without re-computing on every render
- Asked about JSON-LD structured data - for Google Jobs and SEO
- Checked if careers page is SEO-ready

## Code Cleanup

- Found and removed unused files: supabase.js, react.svg, vite.svg
- Removed empty directories
- Cleaned .gitignore
- Removed personal data from .env.example before pushing to GitHub

## Bug Fixes

- Image upload not updating instantly in BrandingEditor
- Was passing wrong object to onUpdate callback
- Fixed by using response.company instead of full response

## Performance

- Upload was taking 4-5 seconds
- Added browser-image-compression for client-side compression
- Added optimistic UI with local preview URLs
- Now feels instant even though upload still takes time

## What I Learned

- React Query handles frontend caching
- Image compression on frontend helps a lot
- Optimistic UI makes things feel faster