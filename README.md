# DJ Sabi — Official Website

One-page press kit website for DJ Sabi targeting event organizers.
Built with React (frontend) and Spring Boot + Kotlin (backend).

---

## Tech Stack

| Layer    | Technology                              |
| -------- | --------------------------------------- |
| Frontend | React 19, TypeScript, Vite, CSS Modules |
| i18n     | react-i18next (DE / EN / UA)            |
| Routing  | React Router v7                         |
| Backend  | Spring Boot 3.4, Kotlin, Spring Data JPA |
| Database | PostgreSQL (Supabase) — H2 in-memory for local dev |
| Auth     | Password + Google Sign-In (admin panel) |
| Email    | Resend API                              |
| Notify   | Telegram Bot API                        |
| Deploy   | Vercel (frontend) + Render (backend)    |

---

## Project Structure

```
dj-website/
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
│   │   ├── components/             ← Navbar, Hero, About, Mixes, Gallery, Contact, Footer, CookieBanner
│   │   ├── pages/                  ← Impressum, Privacy
│   │   ├── i18n/locales/           ← de / en / ua translation JSON files
│   │   └── styles/globals.css
│   ├── vercel.json
│   └── Dockerfile
└── dj-website-backend/
    ├── src/main/kotlin/com/djsabi/backend/
    │   ├── DjWebsiteBackendApplication.kt
    │   ├── ContactController.kt
    │   ├── ContactRequest.kt
    │   ├── EmailService.kt
    │   ├── TelegramService.kt
    │   └── CorsConfig.kt
    ├── src/main/resources/application.properties
    └── Dockerfile
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in real values. Never commit `.env`.

### Backend (Render env vars)

| Variable             | Description                                  |
| -------------------- | -------------------------------------------- |
| `RESEND_API_KEY`     | Resend API key (from resend.com)             |
| `CONTACT_EMAIL`      | Where booking emails are delivered           |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather           |
| `TELEGRAM_CHAT_ID`   | Your Telegram user/chat ID                   |
| `VERCEL_URL`         | Vercel domain (set in Render env vars only)  |
| `DATABASE_URL`       | `jdbc:postgresql://...` — Supabase connection string with `jdbc:` prefix |
| `DB_DRIVER`          | `org.postgresql.Driver`                      |
| `ADMIN_PASSWORD`     | Password for admin login at `/admin`         |
| `ADMIN_GOOGLE_EMAIL` | Gmail address allowed to log in via Google   |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name (photo storage)     |
| `CLOUDINARY_API_KEY`    | Cloudinary API key                        |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret                     |

### Frontend (Vercel / Render build env vars)

| Variable              | Description                                  |
| --------------------- | -------------------------------------------- |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID (see Admin panel setup below) |

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

Uses H2 in-memory database locally — no setup needed. On first boot it seeds events from `src/main/resources/events.json`.

```bash
# Set environment variables first (minimum for local dev)
export ADMIN_PASSWORD=yourpassword
export ADMIN_GOOGLE_EMAIL=your@gmail.com
export RESEND_API_KEY=re_your_api_key
export CONTACT_EMAIL=your@email.com
export TELEGRAM_BOT_TOKEN=your_token
export TELEGRAM_CHAT_ID=your_chat_id

cd dj-website-backend
./gradlew bootRun
# runs on http://localhost:8080
```

### Run both together (local)

The Vite dev server proxies `/api` to `localhost:8080` automatically.
Start backend first, then frontend.

---

## Adding Gallery Photos

### Compress photos before adding

**For bulk compression (recommended for Mac):** [XnConvert](https://www.xnview.com/en/xnconvert/)
- Free, handles batch processing of hundreds of photos
- Export as `.webp` with quality ~80 for a good size/quality balance

**For single photos:** [squoosh.app](https://squoosh.app) (browser-based)

### Add to the project

1. Compress photos to `.webp`
2. Drop files into `dj-website-frontend/src/assets/images/Gallery/`
3. Vite picks them up automatically — no code changes needed

---

## Translations

Translation files are in `dj-website-frontend/src/i18n/locales/`:

- `de/translation.json` — German
- `en/translation.json` — English
- `ua/translation.json` — Ukrainian

Language switcher is in the Navbar.

---

## Admin panel

Available at `/admin`. Login with password or Google Sign-In. Session expires after 1 hour.

Left sidebar navigation with two tabs:
- **Events** (`/admin/events`) — create, edit, delete gig bookings
- **Photos** (`/admin/photos`) — upload originals (auto-compressed by Cloudinary), drag to reorder, delete. Changes reflect immediately in the public gallery.

### Google Sign-In setup

1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID → Web application
3. Add **Authorized JavaScript origins**:
   - `http://localhost:5173`
   - `https://dj-sabi.com`
   - Your staging URL (e.g. `https://dj-website-stage.onrender.com`)
4. Set env vars:
   - `VITE_GOOGLE_CLIENT_ID` — on frontend (Vercel / Render build)
   - `ADMIN_GOOGLE_EMAIL` — on backend (Render)

---

## Photo storage (Cloudinary)

Gallery photos are stored on Cloudinary (free tier: 25 GB storage, 25 GB/month bandwidth). Upload originals — Cloudinary auto-compresses and optimizes.

Setup: cloudinary.com → free account → Dashboard → copy Cloud name, API Key, API Secret → set as `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` on the backend.

The public gallery falls back to static bundled images if the API returns nothing (useful during local dev without Cloudinary configured).

---

## Database (Supabase)

Free PostgreSQL hosted on Supabase. On first backend boot, existing events are auto-seeded from `events.json`.

Connection string: Supabase → Connect → URI tab → prepend `jdbc:` → set as `DATABASE_URL`.

---

## Deployment

### Architecture

| Service            | Branch  | Platform | URL                                                                    |
| ------------------ | ------- | -------- | ---------------------------------------------------------------------- |
| Frontend (prod)    | `main`  | Vercel   | https://dj-sabi.com                                                    |
| Frontend (staging) | `stage` | Vercel   | https://dj-website-git-stage-sabinka1207-7879s-projects.vercel.app     |
| Backend (prod)     | `main`  | Render   | https://dj-website-e09j.onrender.com                                   |
| Backend (staging)  | `stage` | Render   | https://dj-website-stage.onrender.com                                  |

Vercel rewrites `/api/*` to the Render backend URL — no CORS issues.

### Branches

| Branch  | Purpose     | Frontend URL                          |
| ------- | ----------- | ------------------------------------- |
| `main`  | Production  | https://dj-sabi.com                   |
| `stage` | Staging     | Vercel preview URL (auto per PR/push) |

**Workflow:**
1. Work on `stage` branch
2. Push → Vercel builds staging preview automatically
3. Test everything on staging
4. Merge `stage` → `main` (see below) → production updates

### Merging stage → main

`vercel.json` differs between branches (different backend URLs), so never let it overwrite production. Always merge like this:

```bash
git checkout main
git merge stage --no-commit
git checkout main -- dj-website-frontend/vercel.json
git commit -m "Merge stage into main"
git push
```

This merges all changes from `stage` except `vercel.json`, which stays pointing to the production backend.

---

### Step 1 — Deploy backend to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service → connect GitHub repo
3. Set root directory to `dj-website-backend`, language to Docker
4. Add all backend env vars from `.env.example` in the Render dashboard
5. Copy the Render public URL (e.g. `dj-website-backend.onrender.com`)

---

### Step 2 — Configure frontend

`dj-website-frontend/vercel.json` already points to the Render backend:

```json
"destination": "https://dj-website-e09j.onrender.com/api/:path*"
```

If you redeploy the backend and get a new URL, update this file and push.

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

| Method | Endpoint     | Description         |
| ------ | ------------ | ------------------- |
| GET    | /api/events  | List all events     |
| GET    | /api/photos  | List gallery photos (sorted by display order) |
| POST   | /api/contact | Submit booking form |

### Admin (requires `Authorization: Bearer <token>`)

| Method | Endpoint                    | Description                        |
| ------ | --------------------------- | ---------------------------------- |
| POST   | /api/admin/login            | Password login                     |
| POST   | /api/admin/google-login     | Google Sign-In login               |
| GET    | /api/admin/events           | List all events                    |
| POST   | /api/admin/events           | Create event                       |
| PUT    | /api/admin/events/:id       | Update event                       |
| DELETE | /api/admin/events/:id       | Delete event                       |
| GET    | /api/admin/photos           | List all photos                    |
| POST   | /api/admin/photos/upload    | Upload photo (multipart) → Cloudinary |
| DELETE | /api/admin/photos/:id       | Delete photo from Cloudinary + DB  |
| PUT    | /api/admin/photos/reorder   | Bulk update display order          |

### Request body

```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "event": "Club night at Berghain",
  "date": "2025-08-15",
  "message": "We would love to book you for..."
}
```

### Response

- `200 OK` — email and Telegram notification sent
- `500` — server error
