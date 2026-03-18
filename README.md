# Imaginify — Production SaaS for Media Pipelines

Imaginify is a Cloudinary-lite SaaS for creators, developers, and marketers to upload, transform, and deliver media with built-in authentication, billing, usage enforcement, and analytics.

## Target Users & Value Proposition

- **Developers**: integrate media pipelines quickly with API-ready architecture.
- **Creators**: drag-and-drop uploads, instant optimization, easy downloads.
- **Marketing teams**: social-share crops, format conversion, usage visibility.

**Core value:** one platform to process media, manage spend, and scale reliably.

## Pricing

| Tier | Price | Limits | Ideal for |
|---|---:|---|---|
| Free | $0 | 10 uploads/day | early users |
| Pro | $29/mo | higher limits + faster processing | creators/agencies |
| Business | $99/mo | unlimited + priority support | scaling teams |

## Product Features

- Clerk authentication + protected routes.
- Stripe checkout + webhook subscription sync.
- Plan-aware usage limits (daily + monthly).
- Cloudinary service with upload, transform, optimize, delete.
- Dashboard with upload history and usage stats.
- Admin dashboard for users, subscriptions, revenue, recent uploads.
- Internal analytics: DAU, upload volume, free→paid conversion.
- Zod validation + API rate limiting + file abuse checks.

## Improved Folder Structure

```txt
src/
  app/
    (app)/
      home/ billing/ analytics/ admin/ image-upload/ video-upload/
    (auth)/
    api/
      assets/ usage/ image-upload/ video-upload/
      billing/checkout/
      stripe/webhook/
      transform/
      analytics/
      admin/metrics/
  components/
  features/
    uploader/
  services/
    cloudinary.service.ts
    stripe.service.ts
  lib/
    plans.ts
    usage.ts
    analytics.ts
    rate-limit.ts
    validators/
  hooks/
  server/
  types/
prisma/
```

## Database Schema (Prisma)

Core entities:
- `User`
- `Subscription`
- `Usage`
- `Asset`
- `Transaction`
- `AnalyticsEvent`

See full schema in `prisma/schema.prisma`.

## Key Implementation Notes

### 1) Stripe Billing
- Checkout route: `src/app/api/billing/checkout/route.ts`
- Webhook route: `src/app/api/stripe/webhook/route.ts`
- Handles:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
- Syncs user plan + subscription status and stores transactions.

### 2) Usage Limits Middleware Logic
- `src/lib/usage.ts` enforces per-plan daily/monthly upload and transformation limits.
- Upload APIs call `assertWithinUploadLimit(userId, plan)` before Cloudinary upload.
- Limit exceeded => `429` with upgrade/reset guidance.

### 3) Cloudinary Engine
`src/services/cloudinary.service.ts` provides:
- `uploadImage()`
- `uploadVideo()`
- `transformMedia()`
- `deleteAsset()`
- `generateOptimizedUrl()`

### 4) Admin Dashboard
- UI: `src/app/(app)/admin/page.tsx`
- API: `src/app/api/admin/metrics/route.ts`
- Includes:
  - total users
  - paid users
  - active subscriptions
  - revenue
  - recent uploads

### 5) Analytics
- API: `src/app/api/analytics/route.ts`
- Tracks:
  - daily active users
  - upload counts (24h)
  - free→paid conversion
  - recent tracked events

## Setup

1. Install dependencies
   ```bash
   npm ci
   ```
2. Configure env
   ```bash
   cp .env.example .env.local
   ```
3. Generate Prisma client
   ```bash
   npx prisma generate
   ```
4. Run migrations
   ```bash
   npx prisma migrate dev
   ```
5. Start app
   ```bash
   npm run dev
   ```

## Environment Variables

Required variables are documented in `.env.example`, including:
- Clerk
- Cloudinary
- Stripe (secret, webhook, price IDs)
- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL`
- `ADMIN_EMAIL`

## Development Experience

- TypeScript strict mode enabled.
- ESLint + Prettier configured.
- Husky pre-commit (`lint` + `test`).
- CI workflow: `.github/workflows/ci.yml` (lint, test, build).

## Testing

- Unit tests added with Vitest for:
  - plan limits (`src/lib/plans.test.ts`)
  - rate limiting (`src/lib/rate-limit.test.ts`)
  - transform payload validation (`src/lib/validators/upload.test.ts`)

Run:
```bash
npm run test
```

## Deployment (Vercel)

1. Create Postgres database and set `DATABASE_URL`.
2. Add all env vars from `.env.example` to Vercel.
3. Configure Stripe webhook endpoint:
   - `https://<your-domain>/api/stripe/webhook`
4. Run `prisma migrate deploy` during deployment.
5. Deploy with:
   ```bash
   npm run build
   ```

