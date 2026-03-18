# DJ Sabi — Official Website

One-page press kit website for DJ Sabi targeting event organizers.
Built with React (frontend) and Spring Boot + Kotlin (backend).

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 19, TypeScript, Vite, CSS Modules |
| i18n      | react-i18next (DE / EN / UA)            |
| Routing   | React Router v7                         |
| Backend   | Spring Boot 3.4, Kotlin                 |
| Email     | Spring Mail — iCloud SMTP               |
| Notify    | Telegram Bot API                        |
| Serving   | nginx (SPA + API proxy)                 |
| Deploy    | Docker + Docker Compose                 |

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

| Variable             | Description                          |
|----------------------|--------------------------------------|
| `MAIL_USERNAME`      | iCloud email address                 |
| `MAIL_PASSWORD`      | iCloud app-specific password         |
| `CONTACT_EMAIL`      | Where booking emails are delivered   |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token from @BotFather   |
| `TELEGRAM_CHAT_ID`   | Your Telegram user/chat ID           |

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

1. Compress photos to `.webp` using [squoosh.app](https://squoosh.app)
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

## Docker — Production Deployment

### First-time setup on server

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd dj-website

# 2. Create .env from example
cp .env.example .env
nano .env   # fill in real values

# 3. Build and start
docker compose up -d --build
```

Site will be available on port **80**.

### Update after code changes

```bash
git pull
docker compose up -d --build
```

### Useful Docker commands

```bash
# View running containers
docker compose ps

# View logs (all services)
docker compose logs -f

# View logs (backend only)
docker compose logs -f backend

# View logs (frontend/nginx only)
docker compose logs -f frontend

# Stop everything
docker compose down

# Stop and remove volumes
docker compose down -v

# Rebuild a single service
docker compose up -d --build backend
docker compose up -d --build frontend

# Restart a service without rebuilding
docker compose restart backend
```

### Build commands (without Docker)

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

| Method | Endpoint      | Description          |
|--------|---------------|----------------------|
| POST   | /api/contact  | Submit booking form  |

### Request body
```json
{
  "name": "Max Mustermann",
  "event": "Club night at Berghain",
  "date": "2025-08-15",
  "message": "We would love to book you for..."
}
```

### Response
- `200 OK` — email and Telegram notification sent
- `500` — server error
