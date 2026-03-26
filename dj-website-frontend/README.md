# DJ Sabi — Website

Personal website for DJ Sabi. Multilingual (DE / EN / UA), fully responsive, with an admin panel for managing events and photos.

**Production:** https://dj-sabi.com
**Stage:** https://dj-website-peach.vercel.app

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Kotlin + Spring Boot 3 + JPA |
| Database | Supabase (PostgreSQL) — H2 in-memory for local dev |
| Photo storage | Cloudinary (free tier: 25 GB storage / 25 GB bandwidth) |
| Frontend hosting | Vercel |
| Backend hosting | Render (free tier — cold starts ~60s) |
| Email | Resend API |
| Notifications | Telegram Bot |
| Auth | Password + Google Sign-In (OAuth) |

---

## Project structure

```
dj-website/
├── dj-website-frontend/        # React app
│   └── src/
│       ├── sections/           # One-per-page sections (Hero, About, Mixes, Gallery, Events, Contact)
│       ├── components/         # Reusable UI components (Navbar, Footer, CookieBanner, SEO, BookingModal, ProtectedRoute)
│       ├── pages/              # Standalone pages (Impressum, Privacy, admin/*)
│       ├── assets/             # Images, fonts, video
│       └── styles/             # Global CSS
└── dj-website-backend/         # Spring Boot API
```

---

## Local development

### Prerequisites
- Node 20+
- JDK 17+

### Frontend

```bash
cd dj-website-frontend
npm install
npm run dev          # http://localhost:5173
```

No local env vars needed — the frontend proxies `/api/*` to the backend (configured in `vite.config.ts`).

### Backend

```bash
cd dj-website-backend
cp ../.env.example ../.env   # fill in values (or leave empty for H2 defaults)
./gradlew bootRun
```

Without any env vars the backend starts with an in-memory H2 database — enough for local testing. Cloudinary features require `CLOUDINARY_*` vars.

---

## Environment variables

Copy `.env.example` to `.env` and fill in the values. All variables are set in Render (backend) and Vercel (frontend) dashboards for deployed environments.

| Variable | Where | Purpose |
|---|---|---|
| `RESEND_API_KEY` | Backend | Send booking enquiry emails |
| `CONTACT_EMAIL` | Backend | Recipient of booking emails |
| `TELEGRAM_BOT_TOKEN` | Backend | Telegram notification bot |
| `TELEGRAM_CHAT_ID` | Backend | Telegram chat to notify |
| `DATABASE_URL` | Backend | Supabase session pooler JDBC URL |
| `DB_USERNAME` | Backend | Supabase username (`postgres.<project-ref>`) |
| `DB_PASSWORD` | Backend | Supabase password |
| `DB_DRIVER` | Backend | `org.postgresql.Driver` (prod) |
| `ADMIN_PASSWORD` | Backend | Password login for admin panel |
| `ADMIN_GOOGLE_EMAIL` | Backend | Google account allowed in admin |
| `VITE_GOOGLE_CLIENT_ID` | Frontend (build) | Google OAuth client ID |
| `CLOUDINARY_CLOUD_NAME` | Backend | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Backend | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Backend | Cloudinary API secret |
| `VERCEL_URL` | Backend | Vercel domain for CORS allowlist |

> **Supabase note:** use the **Session Mode pooler** URL (`aws-1-eu-north-1.pooler.supabase.com:5432`), not the direct connection — Render's free tier is IPv4-only and the direct URL is IPv6.

> **Google OAuth note:** add both `http://localhost:5173` and `https://dj-sabi.com` (and the stage Vercel URL) to the authorized JavaScript origins in Google Cloud Console.

---

## Admin panel

URL: `/admin` (redirects to `/admin/events`)

Login options:
- Password (set via `ADMIN_PASSWORD` env var)
- Google Sign-In (account must match `ADMIN_GOOGLE_EMAIL`)

Features:
- **Events** — create / edit / delete bookings shown in the public calendar
- **Photos** — upload to Cloudinary, drag-to-reorder, delete, sync from Cloudinary folder (`dj-sabi/gallery`)

---

## Deployment

### Backend (Render)
- Service type: **Web Service** (Docker)
- Set all backend env vars in Render dashboard
- Free tier sleeps after 15 min inactivity; cold start takes ~60s
- The frontend auto-reloads after 75s if the backend doesn't respond

### Frontend (Vercel)
- Connected to GitHub repo, deploys automatically on push
- `main` branch → production (`dj-sabi.com`)
- `stage` branch → staging (`dj-website-peach.vercel.app`)
- `vercel.json` proxies `/api/*` to the Render backend URL

### Branches
- `main` — production
- `stage` — staging (same code, different Render/Vercel targets)

> When merging `stage → main`, manually verify `vercel.json` still points to the production backend URL after the merge.
