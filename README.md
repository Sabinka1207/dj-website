# DJ Sabi — Official Website

One-page press kit website for DJ Sabi targeting event organizers.
Built with React (frontend) and Spring Boot + Kotlin (backend).

---

## Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Frontend     | React 19, TypeScript, Vite, CSS Modules             |
| i18n         | react-i18next (DE / EN / UA), browser lang detection, localStorage persistence |
| Routing      | React Router v7                                     |
| Backend      | Spring Boot 3.4, Kotlin, Spring Data JPA            |
| Validation   | Jakarta Bean Validation (`@Valid`), Bucket4j rate limiting (5 req/hour/IP) |
| Database     | PostgreSQL (Supabase) — H2 in-memory for local dev  |
| Migrations   | Flyway (`db/migration/`)                            |
| Auth         | Password + Google Sign-In (admin panel)             |
| Email        | Resend API                                          |
| Notify       | Telegram Bot API                                    |
| Monitoring   | UptimeRobot                                         |
| CI           | GitHub Actions (test + build on every push)         |
| Deploy       | Vercel (frontend) + Render (backend)                |

---

## Project Structure

```
dj-website/
├── .github/workflows/ci.yml       ← GitHub Actions CI
├── docker-compose.yml
├── .env.example
├── .gitignore
├── dj-website-frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   ├── images/
│   │   │   │   ├── Gallery/        ← gallery photos (.webp)
│   │   │   │   └── *.webp          ← about photo
│   │   │   └── video/              ← hero background video
│   │   ├── sections/               ← Hero, About, Mixes, Gallery, Events, Contact
│   │   ├── components/             ← Navbar, Footer, CookieBanner, BookingModal, ContactModal, ProtectedRoute, SEO
│   │   ├── pages/                  ← Impressum, Privacy, ForOrganisers, admin/*
│   │   ├── i18n/locales/           ← de / en / ua translation JSON files
│   │   └── styles/globals.css
│   ├── vercel.json                 ← API proxy + CSP headers (backend URL hardcoded per branch)
│   └── Dockerfile
└── dj-website-backend/
    ├── src/main/kotlin/com/djsabi/backend/
    │   ├── model/                  ← Event.kt, Photo.kt, BookingRequest.kt, UnavailableDate.kt, Mix.kt, ExternalMix.kt
    │   ├── repository/             ← EventRepository.kt, PhotoRepository.kt, BookingRequestRepository.kt, UnavailableDateRepository.kt, MixRepository.kt, ExternalMixRepository.kt
    │   ├── DjWebsiteBackendApplication.kt
    │   ├── ContactController.kt
    │   ├── ContactRequest.kt
    │   ├── GlobalExceptionHandler.kt   ← returns 400 with field errors on validation failure
    │   ├── RateLimitInterceptor.kt     ← Bucket4j, 5 req/hour/IP
    │   ├── WebConfig.kt
    │   ├── EventController.kt
    │   ├── AdminEventController.kt
    │   ├── PhotoController.kt
    │   ├── AdminPhotoController.kt
    │   ├── AdminBookingController.kt
    │   ├── AdminUnavailableDateController.kt
    │   ├── UnavailableDateController.kt
    │   ├── MixController.kt            ← public hosted mixes + featured endpoint
    │   ├── AdminMixController.kt       ← upload/edit/delete/reorder hosted mixes + cover management
    │   ├── AdminCloudinaryController.kt ← GET /api/admin/cloudinary-usage (storage/bandwidth stats)
    │   ├── ExternalMixController.kt    ← public external mixes + featured endpoint
    │   ├── AdminExternalMixController.kt ← CRUD for external mixes, auto URL conversion
    │   ├── ClientErrorController.kt    ← POST /api/client-error (frontend JS crash reporting → Telegram)
    │   ├── AdminAuthController.kt
    │   ├── AdminAuthService.kt
    │   ├── CloudinaryConfig.kt
    │   ├── R2Config.kt                 ← Cloudflare R2 S3Client bean (mix audio storage)
    │   ├── CorsConfig.kt
    │   ├── EmailService.kt
    │   └── TelegramService.kt
    ├── src/main/resources/
    │   ├── application.properties
    │   └── db/migration/
    │       ├── V1__create_tables.sql
    │       ├── V2__create_mixes_table.sql
    │       ├── V3__create_external_mixes_table.sql
    │       ├── V4__add_home_featured_to_external_mixes.sql
    │       ├── V5__add_home_display_order_to_external_mixes.sql
    │       ├── V6__add_home_featured_to_mixes.sql
    │       ├── V7__add_cover_url_to_mixes.sql
    │       └── V8__add_cover_public_id_to_mixes.sql
    └── Dockerfile
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in real values. Never commit `.env`.

### Backend (Render env vars)

| Variable                | Description                                  |
| ----------------------- | -------------------------------------------- |
| `RESEND_API_KEY`        | Resend API key (from resend.com)             |
| `CONTACT_EMAIL`         | Where booking emails are delivered           |
| `TELEGRAM_BOT_TOKEN`    | Telegram bot token from @BotFather           |
| `TELEGRAM_CHAT_ID`      | Your Telegram user/chat ID                   |
| `APP_ENV`               | Environment tag in error alerts: `prod` or `stage` (default: `prod`) |
| `VERCEL_URL`            | Vercel domain (set in Render env vars only)  |
| `DATABASE_URL`          | `jdbc:postgresql://aws-1-*.pooler.supabase.com:5432/postgres?sslmode=require` — use session pooler URL |
| `DB_USERNAME`           | `postgres.your-project-ref` (from Supabase session pooler connection string) |
| `DB_PASSWORD`           | Supabase database password                   |
| `DB_DRIVER`             | `org.postgresql.Driver`                      |
| `DB_DIALECT`            | `org.hibernate.dialect.PostgreSQLDialect`    |
| `ADMIN_PASSWORD`        | Password for admin login at `/admin`         |
| `ADMIN_GOOGLE_EMAIL`    | Gmail address allowed to log in via Google   |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (cover images)         |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                           |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                        |
| `R2_ACCOUNT_ID`         | Cloudflare account ID                        |
| `R2_ACCESS_KEY_ID`      | R2 API token access key (mix audio)          |
| `R2_SECRET_ACCESS_KEY`  | R2 API token secret                          |
| `R2_BUCKET_NAME`        | R2 bucket name (e.g. `dj-sabi-mixes`)       |
| `R2_PUBLIC_URL`         | Public bucket URL (e.g. `https://pub-xxx.r2.dev`) |
| `UMAMI_API_TOKEN`       | API token from umami.is → Settings → API Keys      |
| `UMAMI_WEBSITE_ID`      | Website ID from umami.is → Settings → Websites     |

### Frontend (Vercel env vars — set in Vercel dashboard)

| Variable                   | Description                                             |
| -------------------------- | ------------------------------------------------------- |
| `VITE_GOOGLE_CLIENT_ID`    | Google OAuth Client ID                                  |

### Get Telegram chat ID

Send a message to your bot, then open:
`https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates`

---

## Local Development

### Frontend

```bash
cd dj-website-frontend
npm install
npm run dev
# runs on http://localhost:5173
```

### Backend

Uses H2 in-memory database locally — no setup needed. Flyway runs migrations automatically on startup. On first boot it seeds events from `src/main/resources/events.json`.

```bash
cd dj-website-backend
set -a && source ../.env && set +a && ./gradlew bootRun
# runs on http://localhost:8080
```

### Run both together (local)

The Vite dev server proxies `/api` to `localhost:8080` automatically.
Start backend first, then frontend.

---

## Adding Gallery Photos

Photos are managed through the admin panel (`/admin/photos`) and stored on Cloudinary. No static files needed.

### Upload via admin panel

1. Log in to `/admin`
2. Go to **Photos** tab
3. Click the **upload icon** (↑) — upload originals, Cloudinary handles compression automatically

### Sync existing Cloudinary photos

If you already have photos in Cloudinary under `dj-sabi/gallery`, click **Sync from Cloudinary** in the admin Photos tab. It imports any photos not yet in the database.

### Static fallback

The public gallery falls back to static bundled images in `dj-website-frontend/src/assets/images/Gallery/` if the API returns nothing (useful during local dev without Cloudinary configured). These can be removed once you have photos in Cloudinary.

---

## Translations

Translation files are in `dj-website-frontend/src/i18n/locales/`:

- `de/translation.json` — German
- `en/translation.json` — English
- `ua/translation.json` — Ukrainian

Language switcher is in the Navbar. The selected language is saved to `localStorage` and restored on next visit. On first visit, browser language is detected automatically (DE → German, UK/RU → Ukrainian, everything else → English).

---

## For Organisers page

Available at `/for-organisers`. Contains:
- Press kit downloads (language-aware PDF per DE/EN/UA)
- Press photos (Google Drive link)
- Logo downloads (JPG / PNG)
- Live videos & examples
- Hospitality Rider, Technical Rider, Contract (language variants planned)
- Contact modal for quick questions

---

## Admin panel

Available at `/admin`. Login with password or Google Sign-In. Session expires after 1 hour.

Left sidebar navigation:
- **Bookings** (`/admin/bookings`) — view all booking inquiries submitted via the contact/calendar form. New requests are highlighted and counted in the sidebar badge. Open a request to read, reply by email, mark as answered, or delete.
- **Events** (`/admin/events`) — create, edit, delete gig bookings
- **Availability** (`/admin/availability`) — block specific dates so they appear greyed-out and non-clickable in the public events calendar
- **Photos** (`/admin/photos`) — upload originals (auto-compressed by Cloudinary), drag to reorder, delete individual or delete all. Use **Sync from Cloudinary** to import photos already in the `dj-sabi/gallery` folder on Cloudinary without re-uploading. Changes reflect immediately in the public gallery.
- **Mixes** (`/admin/mixes`) — upload MP3s (stored on Cloudflare R2), add optional cover image, edit metadata (title, year, style, event, city), delete (removes from R2 too). Click any column header to sort. Toggle which mixes appear on the home page and set their display order.
- **External Mixes** (`/admin/external-mixes`) — add YouTube, Mixcloud, or SoundCloud mixes by pasting any direct URL (auto-converted to embed URL server-side). Edit metadata, toggle home page featuring with ordering.
- **Org Docs** (`/admin/org-docs`) — manage press kit, tech rider, hospitality rider, booking agreements and other organiser documents. Upload/edit/delete per language variant.
- **Analytics** (`/admin/analytics`) — two tabs: **Website Stats** (Umami-powered — visitors, page views, visits, bounce rate, avg session, page views chart with daily/weekly grouping, breakdowns by country, device, OS, browser, top pages, referrers, language; 7/30/90-day ranges with period comparison) and **Mix Play & Download Stats** (internal — per-mix play count, unique listeners, total time played, downloads, unique downloaders; sortable columns).
- **Tools** (`/admin/tools`) — quick links to all services (Vercel, Render, Supabase, Cloudinary, etc.) plus a live Cloudinary storage/bandwidth/objects usage panel fetched from the Cloudinary Admin API.

### Google Sign-In setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID → Web application
3. Add **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `https://dj-sabi.com`
   - `https://dj-website-peach.vercel.app` (staging)
4. Set env vars:
   - `VITE_GOOGLE_CLIENT_ID` — on frontend (Vercel)
   - `ADMIN_GOOGLE_EMAIL` — on backend (Render)

---

## Mixes

The site supports two types of mixes:

### Hosted mixes (MP3 uploaded directly)
- Upload via `/admin/mixes` — audio file stored on **Cloudflare R2** (zero egress cost, S3-compatible)
- Optional cover image stored on **Cloudinary** (`dj-sabi/mix-covers`)
- Cover falls back to the DJ Sabi logo if not set
- Duration measured client-side (browser `<audio>` element) before upload
- Rendered with a custom HTML5 audio player (play/pause, seekable progress bar, volume control, download button)
- Deleting a mix removes audio from R2 and cover image from Cloudinary

### External mixes (YouTube / Mixcloud / SoundCloud)
- Add via `/admin/external-mixes` — paste any direct URL, it's auto-converted to the correct embed URL server-side:
  - `youtube.com/watch?v=...` or `youtu.be/...` → YouTube embed
  - `mixcloud.com/...` → Mixcloud widget
  - `soundcloud.com/...` → SoundCloud widget
- Rendered as iframes

### Home page featuring
Both types can be featured on the home page. Toggle the home icon in the admin table to show/hide, and set the display order. If nothing is featured, the 2 latest YouTube mixes are shown as fallback.

---

## Media storage

### Gallery photos & mix covers — Cloudinary

Gallery photos and mix cover images are stored on Cloudinary (free tier: 25 GB storage, 25 GB/month bandwidth). Upload originals — Cloudinary auto-compresses and optimizes.

Setup: cloudinary.com → free account → Dashboard → copy Cloud name, API Key, API Secret → set as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` on the backend.

The public gallery falls back to static bundled images if the API returns nothing (useful during local dev without Cloudinary configured).

### Mix audio files — Cloudflare R2

MP3 files are stored on Cloudflare R2 (S3-compatible, zero egress cost — no charge when visitors stream).

Setup:
1. [dash.cloudflare.com](https://dash.cloudflare.com) → R2 → Create bucket (e.g. `dj-sabi-mixes`)
2. Bucket Settings → Enable **Public Access** → copy the `pub-xxx.r2.dev` URL → set as `R2_PUBLIC_URL`
3. R2 → Manage R2 API Tokens → Create API Token → Object Read & Write on your bucket
4. Copy Access Key ID and Secret Access Key → set as `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
5. Set `R2_ACCOUNT_ID` (Cloudflare account ID from the dashboard URL) and `R2_BUCKET_NAME`

---

## Database (Supabase)

Free PostgreSQL hosted on Supabase. Schema is managed by Flyway — migrations live in `dj-website-backend/src/main/resources/db/migration/`. On first backend boot, existing events are auto-seeded from `events.json`.

Use the **Session Mode pooler** connection string (not the direct connection) — Render's free tier is IPv4 only, but Supabase direct connections are IPv6. The pooler supports both.

In Supabase → Connect → Session pooler tab, copy the host (e.g. `aws-1-eu-north-1.pooler.supabase.com`) and set:
- `DATABASE_URL` = `jdbc:postgresql://<pooler-host>:5432/postgres?sslmode=require`
- `DB_USERNAME` = `postgres.<project-ref>` (shown in the pooler connection string)
- `DB_PASSWORD` = your Supabase password

### Adding schema changes

Never modify `application.properties` DDL settings. Instead, create a new migration file:

```
src/main/resources/db/migration/V2__your_description.sql
```

Flyway runs it automatically on next startup.

---

## CI (GitHub Actions)

On every push, two parallel jobs run:

| Job      | Steps                                        |
| -------- | -------------------------------------------- |
| Backend  | Java 17 → Gradle cache → `./gradlew test` → `./gradlew bootJar` |
| Frontend | Node 20 → `npm ci` → `npm run lint` → `npm run build` |

Workflow file: `.github/workflows/ci.yml`

---

## Deployment

### Architecture

| Service            | Branch  | Platform | URL                                                                    |
| ------------------ | ------- | -------- | ---------------------------------------------------------------------- |
| Frontend (prod)    | `main`  | Vercel   | https://dj-sabi.com                                                    |
| Frontend (staging) | `stage` | Vercel   | https://dj-website-peach.vercel.app                                    |
| Backend (prod)     | `main`  | Render   | https://dj-website-e09j.onrender.com                                   |
| Backend (staging)  | `stage` | Render   | https://dj-website-stage.onrender.com                                  |

Vercel rewrites `/api/*` to the Render backend — no CORS issues.

### Branches

| Branch  | Purpose     | Frontend URL                          |
| ------- | ----------- | ------------------------------------- |
| `main`  | Production  | https://dj-sabi.com                   |
| `stage` | Staging     | https://dj-website-peach.vercel.app   |

**Workflow:**
1. Work on `stage` branch
2. Push → Vercel builds staging preview automatically
3. Test everything on staging
4. Merge `stage` → `main` (see below) → production updates

### Merging stage → main

`vercel.json` differs between branches (stage points to stage backend, main to prod backend), so never let it overwrite production. Always merge like this:

```bash
git checkout main
git merge stage --no-commit
git checkout main -- dj-website-frontend/vercel.json
git commit -m "Merge stage into main"
git push
```

This merges all changes from `stage` except `vercel.json`, which stays pointing to the production backend.

### Keeping the backend alive (free)

Render free tier sleeps after 15 min inactivity (cold start ~60s). Use [UptimeRobot](https://uptimerobot.com) (free, up to 50 monitors, 5-min interval):

1. Sign up → **Add New Monitor** → type **HTTP(s)**
2. Add one monitor per backend:
   - `https://dj-website-e09j.onrender.com/api/health` (production)
   - `https://dj-website-stage.onrender.com/api/health` (stage)
3. **Monitoring Interval:** 5 minutes → Save

---

### Step 1 — Deploy backend to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service → connect GitHub repo
3. Set root directory to `dj-website-backend`, language to Docker
4. Add all backend env vars from `.env.example` in the Render dashboard
5. Copy the Render public URL (e.g. `dj-website-backend.onrender.com`)

---

### Step 2 — Configure frontend

`dj-website-frontend/vercel.json` has the backend URL hardcoded per branch:
- `stage` branch → `https://dj-website-stage.onrender.com`
- `main` branch → `https://dj-website-e09j.onrender.com`

If you redeploy the backend and get a new URL, update `vercel.json` and push.

---

### Step 3 — Deploy frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → Import GitHub repo
2. Set root directory to `dj-website-frontend`
3. Connect domain `dj-sabi.com` in Vercel dashboard → Settings → Domains

---

### Step 4 — Update CORS on Render

Add this env var in Render → Environment:

```
VERCEL_URL=dj-sabi.com
```

---

### Update after code changes

```bash
git add .
git commit -m "your message"
git push
```

Both Render and Vercel redeploy automatically on push.

---

### Build commands (manual)

```bash
# Frontend production build
cd dj-website-frontend
npm run build
# output in dist/

# Backend production JAR
cd dj-website-backend
./gradlew bootJar
# output in build/libs/
```

---

## API

### Public

| Method | Endpoint                       | Description                                      |
| ------ | ------------------------------ | ------------------------------------------------ |
| GET    | /api/events                    | List all events                                  |
| GET    | /api/photos                    | List gallery photos (sorted by display order)    |
| POST   | /api/contact                   | Submit booking form (saves to DB + sends email/Telegram). Rate limited: 5 req/hour/IP. |
| GET    | /api/unavailable-dates         | List blocked dates for the calendar              |
| GET    | /api/health                    | Health check — returns `{"status":"ok"}`         |
| GET    | /api/mixes                     | List all hosted mixes (sorted by display order)  |
| GET    | /api/mixes/featured            | List home-featured hosted mixes                  |
| GET    | /api/external-mixes            | List all external mixes (sorted by year desc)    |
| GET    | /api/external-mixes/featured   | List home-featured external mixes                |

### Admin (requires `Authorization: Bearer <token>`)

| Method | Endpoint                               | Description                                        |
| ------ | -------------------------------------- | -------------------------------------------------- |
| POST   | /api/admin/login                       | Password login                                     |
| POST   | /api/admin/google-login                | Google Sign-In login                               |
| GET    | /api/admin/bookings                    | List all booking requests                          |
| GET    | /api/admin/bookings/unread-count       | Count of unread (new) booking requests             |
| PATCH  | /api/admin/bookings/:id/read           | Mark booking as read                               |
| PATCH  | /api/admin/bookings/:id/unread         | Mark booking as new (unread)                       |
| PATCH  | /api/admin/bookings/:id/answered       | Mark booking as answered (no email sent)           |
| POST   | /api/admin/bookings/:id/reply          | Send email reply + mark as answered                |
| DELETE | /api/admin/bookings/:id                | Delete booking request                             |
| GET    | /api/admin/events                      | List all events                                    |
| POST   | /api/admin/events                      | Create event                                       |
| PUT    | /api/admin/events/:id                  | Update event                                       |
| DELETE | /api/admin/events/:id                  | Delete event                                       |
| GET    | /api/admin/photos                      | List all photos                                    |
| POST   | /api/admin/photos/upload               | Upload photo (multipart) → Cloudinary              |
| POST   | /api/admin/photos/sync                 | Import existing Cloudinary photos from `dj-sabi/gallery` |
| DELETE | /api/admin/photos/:id                  | Delete photo from Cloudinary + DB                  |
| DELETE | /api/admin/photos                      | Delete all photos from Cloudinary + DB             |
| PUT    | /api/admin/photos/reorder              | Bulk update display order                          |
| GET    | /api/admin/unavailable-dates           | List blocked dates (with id and note)              |
| POST   | /api/admin/unavailable-dates           | Block a date `{ date, note? }`                     |
| DELETE | /api/admin/unavailable-dates/:id       | Remove a blocked date                              |
| GET    | /api/admin/mixes                       | List all hosted mixes                              |
| POST   | /api/admin/mixes/upload                | Upload MP3 + optional cover (multipart) → Cloudinary |
| PUT    | /api/admin/mixes/:id                   | Update mix metadata                                |
| POST   | /api/admin/mixes/:id/cover             | Replace cover image → Cloudinary                   |
| DELETE | /api/admin/mixes/:id/cover             | Remove cover image from Cloudinary + DB            |
| PATCH  | /api/admin/mixes/:id/featured          | Toggle home page featuring                         |
| PATCH  | /api/admin/mixes/:id/home-order        | Set home display order                             |
| DELETE | /api/admin/mixes/:id                   | Delete mix + cover from Cloudinary + DB            |
| PUT    | /api/admin/mixes/reorder               | Bulk update display order                          |
| GET    | /api/admin/external-mixes              | List all external mixes                            |
| POST   | /api/admin/external-mixes              | Add external mix (URL auto-converted to embed URL) |
| PUT    | /api/admin/external-mixes/:id          | Update external mix                                |
| PATCH  | /api/admin/external-mixes/:id/featured | Toggle home page featuring                         |
| PATCH  | /api/admin/external-mixes/:id/home-order | Set home display order                           |
| DELETE | /api/admin/external-mixes/:id          | Delete external mix                                |
| GET    | /api/admin/cloudinary-usage            | Cloudinary storage, bandwidth, objects usage stats |
| GET    | /api/admin/analytics/stats             | Site stats (visitors, pageviews, visits, bounces, avg session) with period comparison |
| GET    | /api/admin/analytics/pageviews         | Pageviews over time aggregated by unit (day/week/month), timezone-aware |
| GET    | /api/admin/analytics/metrics           | Breakdown by type: country, device, os, browser, url, referrer, language |
| POST   | /api/client-error                      | Report frontend JS error → Telegram (rate-limited) |
