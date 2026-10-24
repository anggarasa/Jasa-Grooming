# TAMPILKIT STUDIO — BASIC BOOKING TEMPLATE
# PHASE 04 — PUBLIC GROOMING WEBSITE & DYNAMIC SERVICE CATALOG

## 1. PROJECT CONTEXT & RULES
- Project: TampilKit Booking (PawCare Grooming)
- Technology: Next.js App Router, TypeScript strict, React 19, PostgreSQL, Prisma ORM, shadcn/ui, Tailwind CSS v4, Lucide React, Zod, MinIO (Docker Desktop), JWT.
- Preserve Phase 01, 02, and 03 features. Do not proceed to Phase 05.
- User-facing text: Bahasa Indonesia. No hardcoded fake data (data dynamically loaded from PostgreSQL & MinIO).

## 2. MAIN OBJECTIVES
1. Reusable Public Layout:
   - Header (Logo, Name, Navigation links, Booking CTA button, Mobile Sheet navigation).
   - Footer (Logo, description, quick links, address, contact, WhatsApp, hours summary, copyright).
2. Dynamic Public Pages (Server Components with Next.js App Router):
   - `/` (Homepage: Hero, Why Choose Us, Featured Services 3-6 items, How Booking Works, Gallery Preview, Business Info & Hours, Final CTA).
   - `/services` (Service Catalog with category filtering via URL query params `?category=slug`, search, accurate IDR price format, empty states).
   - `/services/[slug]` (Service detail page: image, title, category, price, duration, buffer, full description, booking CTA `/booking?service={id}`, related services, 404 for inactive/unknown).
   - `/gallery` (Dynamic gallery grid from `BusinessGallery`, captions, alt text, responsive lightbox/modal, loading & empty states).
   - `/about` (About us: real business description from PostgreSQL, brand values, service overview, gallery preview, contact CTA).
   - `/contact` (Contact us: address, phone, WhatsApp dynamic link with prefilled message, email, operating hours weekly table, Google Maps link, booking CTA).
   - `/booking` (Booking entry point placeholder for Phase 05: displays selected service if query param exists, informs that online booking is being prepared, link to services or WhatsApp).
3. Data Access & Caching Layer:
   - `src/modules/public/`: `public-business.service.ts`, `public-services.service.ts`, `public-gallery.service.ts`, `public-operating-hours.service.ts`.
   - Server Components for public reads.
   - Cache invalidation (revalidatePath / revalidateTag) when admin updates business profile, operating hours, categories, services, or gallery.
4. Technical SEO:
   - Dynamic `generateMetadata` for all public pages (title, description, canonical, OG, Twitter).
   - `/sitemap.xml` (`sitemap.ts`): all active public pages and active service slugs (exclude inactive & admin dashboard).
   - `/robots.txt` (`robots.ts`).
   - JSON-LD Structured Data (LocalBusiness, Service, BreadcrumbList) using real data.
5. MinIO Media Access for Public:
   - Public assets (business logo, active service images, active gallery images) served via safe server-controlled proxy `/api/media/[...key]` without exposing credentials. Reject arbitrary private object requests.
6. Accessibility (WCAG 2.2 AA) & Responsive Design (Mobile 320px+, Tablet, Desktop).
7. Unit & Integration Tests (Vitest) for public services, SEO metadata, filtering, detail pages, gallery, hours, regression checks.
