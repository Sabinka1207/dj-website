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
| Backend  | Spring Boot 3.4, Kotlin                 |
| Email    | Spring Mail — iCloud SMTP               |
| Notify   | Telegram Bot API                        |
| Serving  | nginx (SPA + API proxy)                 |
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
│   ├── Dockerfile
│   └── nginx.conf
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

| Variable             | Description                              |
| -------------------- | ---------------------------------------- |
| `MAIL_USERNAME`      | iCloud email address                     |
| `MAIL_PASSWORD`      | iCloud app-specific password             |
| `CONTACT_EMAIL`      | Where booking emails are delivered       |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather       |
| `TELEGRAM_CHAT_ID`   | Your Telegram user/chat ID               |
| `VERCEL_URL`         | Vercel preview URL (set in Railway only) |

### Generate iCloud app-specific password

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign In → App-Specific Passwords → Generate

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

```bash
# Set environment variables first
export MAIL_USERNAME=your@icloud.com
export MAIL_PASSWORD=your-app-password
export CONTACT_EMAIL=your@icloud.com
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

## Deployment

### Architecture

| Service  | Platform | Folder                | URL                                  |
| -------- | -------- | --------------------- | ------------------------------------ |
| Frontend | Vercel   | `dj-website-frontend` | https://dj-sabi.com                  |
| Backend  | Render   | `dj-website-backend`  | https://dj-website-e09j.onrender.com |

Vercel rewrites `/api/*` to the Railway backend URL — no CORS issues.

---

### Step 1 — Deploy backend to Railway

1. Push this repo to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Set root directory to `dj-website-backend`
4. Add all environment variables from `.env.example` in the Railway dashboard
5. Copy the Railway public URL (e.g. `dj-website-backend.up.railway.app`)

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

Both Railway and Vercel redeploy automatically on push.

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

| Method | Endpoint     | Description         |
| ------ | ------------ | ------------------- |
| POST   | /api/contact | Submit booking form |

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
