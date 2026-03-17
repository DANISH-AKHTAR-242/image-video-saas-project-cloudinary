<div align="center">

# Imaginify – Cloudinary SaaS Starter

Production-ready Next.js SaaS for uploading, transforming, and delivering images & videos on Cloudinary with per-user quotas.

</div>

## Table of Contents
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Schema](#database-schema)
- [API](#api)
- [Usage Limits](#usage-limits)
- [Deployment](#deployment)

## Features
- Clerk authentication (sign-in/up, protected routes).
- Cloudinary service layer for uploads, transformations, and secure URLs.
- Prisma/PostgreSQL persistence with user-owned assets.
- Daily free-tier quota (10 uploads/day) with usage tracking endpoint.
- Video and image upload flows with previews and compression stats.
- Social share image resizing presets.
- Responsive dashboard with per-user asset history.

## Architecture
```
app/                # Next.js App Router pages + route handlers
app/api/*           # API routes (upload, assets, usage)
components/         # UI components (cards, shared widgets)
lib/                # Prisma client, user helpers, usage limits, validators
services/           # Cloudinary abstraction
prisma/             # Schema and generated client
types/              # Shared TypeScript contracts
```

## Tech Stack
- **Next.js 15 (App Router)** + **TypeScript**
- **Clerk** for authentication
- **Prisma** + **PostgreSQL** for data
- **Cloudinary** + **next-cloudinary** for media
- **Tailwind CSS 4 / DaisyUI** for styling
- **Zod** for payload validation

## Getting Started
1. Install dependencies
   ```bash
   npm install
   ```
2. Configure environment
   ```bash
   cp .env.example .env.local
   # Fill in Clerk, Cloudinary, and DATABASE_URL
   ```
3. Generate Prisma client
   ```bash
   DATABASE_URL="postgresql://user:password@localhost:5432/imagify" npx prisma generate
   ```
4. Run the dev server
   ```bash
   npm run dev
   ```

## Environment Variables
See `.env.example` for the full list:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `DATABASE_URL`

## Database Schema
- **User**: id, email, plan (FREE/PRO/TEAM)
- **Asset**: userId, type (IMAGE/VIDEO), publicId, sizes, duration, format, timestamps
- **Usage**: userId, uploadsToday, lastResetAt, lastUploadAt

## API
- `POST /api/video-upload` – Upload a video, compress, persist asset.
- `POST /api/image-upload` – Upload an image, persist asset.
- `GET /api/videos` – List current user's video assets.
- `GET /api/usage` – Usage snapshot (plan, uploads today, free-tier limit).

All upload routes require authentication and enforce daily limits.

## Usage Limits
- Free tier: **10 uploads/day** per user (images + videos).
- Limits reset daily (UTC). Exceeding returns **429** with a reset hint.

## Deployment
- Set all environment variables in your host (Vercel/Render/Fly).
- Ensure Postgres is reachable from your deployment.
- Run database migrations before first deploy (`prisma migrate deploy`).
