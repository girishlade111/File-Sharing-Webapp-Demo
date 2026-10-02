# File Sharing Webapp Demo

A modern file-sharing web application built with React, TypeScript, and Vite — upload files,
organize them in a dashboard, and share them via public download links. Supabase provides
authentication, database, and storage on the backend. This repo is a demo/template version.

## Features

- File upload with progress tracking (Supabase Storage)
- Public file download pages with shareable links
- Auth pages (sign up / login) backed by Supabase Auth
- Dashboard with sidebar navigation, file grid, and task board views
- shadcn/ui component library + Tailwind CSS styling
- Framer Motion animations, Lucide icons, React Hook Form + Zod validation
- React Router client-side routing

## Tech Stack

- React 18 + TypeScript + Vite 5
- Supabase (Auth, Postgres, Storage) — `@supabase/supabase-js`
- Tailwind CSS 3 + shadcn/ui + Radix UI primitives
- React Router 6, React Hook Form, Zod
- Framer Motion, Lucide React

## Quick Start

Requirements: Node.js 18+.

```bash
npm install
# add your Supabase credentials in .env
npm run dev
```

### Environment variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous (publishable) key |

The repo ships with demo credentials in `.env` for quick preview; replace them with your own
Supabase project credentials for real use.

## Project Structure

```
src/
  App.tsx                    # routes + app shell
  components/
    FileUpload.tsx           # upload UI with progress
    FileDownload.tsx         # public download page
    auth/                    # login / signup forms
    dashboard/               # dashboard pages, sidebar, top nav
    pages/                   # routed pages (home, dashboard, success)
    ui/                      # shadcn/ui primitives
  main.tsx                   # entry point
supabase/                    # supabase config / migrations
```

## Build & Deploy

```bash
npm run build        # tsc + vite build -> dist/
```

The app is fully static once built (all data comes from Supabase client-side), so `dist/` can be
hosted on any static host (GitHub Pages, Cloudflare Pages, Netlify, Vercel).

---

Built by Girish Lade — https://ladestack.in
