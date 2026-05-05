# 🔗 SNIP — URL Shortener v2 (with Auth)

Full-stack URL shortener with **JWT auth + Google OAuth**.

## Stack
- **Backend:** Node.js 24 + Express 5 + SQLite (`better-sqlite3`)
- **Auth:** JWT (access + refresh tokens) + Google OAuth 2.0
- **Frontend:** Vanilla HTML/CSS/JS (no build step)

## Quick Start

```bash
cd backend
npm install
npm start
```
Open **http://localhost:3000**

## Google OAuth Setup (optional)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → **APIs & Services → Credentials**
3. Create **OAuth 2.0 Client ID** (Web application)
4. Add Authorized redirect URI: `http://localhost:3000/api/auth/google/callback`
5. Copy Client ID and Secret into `.env`:

```bash
# backend/.env
JWT_SECRET=your_random_32plus_char_secret
JWT_REFRESH_SECRET=another_random_32plus_char_secret
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
BASE_URL=http://localhost:3000
```

Google OAuth works automatically once `.env` is set. Without it, only email/password login works.

## Auth Flow

```
Register / Login  →  Access Token (15min) + Refresh Token cookie (7 days, httpOnly)
Expired access    →  Silent refresh via /api/auth/refresh
Logout            →  Refresh token deleted server-side
Google OAuth      →  Redirect flow → token in URL fragment → stored in sessionStorage
```

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register with email + password |
| POST | `/api/auth/login` | Login, returns access token |
| POST | `/api/auth/refresh` | Rotate refresh token, get new access token |
| POST | `/api/auth/logout` | Invalidate refresh token |
| GET | `/api/auth/me` | Get current user (requires Bearer token) |
| GET | `/api/auth/google` | Start Google OAuth flow |
| GET | `/api/auth/google/callback` | Google OAuth callback |

### URLs (all require `Authorization: Bearer <token>`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shorten` | Create short URL |
| GET | `/api/urls` | List your URLs (supports `?q=search`) |
| GET | `/api/urls/:code/stats` | Analytics for a link |
| DELETE | `/api/urls/:code` | Delete a link |
| GET | `/:code` | Public redirect (no auth needed) |

## Project Structure

```
url-shortener/
├── backend/
│   ├── server.js         ← Express API + auth + redirects
│   ├── package.json
│   ├── .env.example      ← copy to .env
│   └── urls.db           ← auto-created SQLite DB
└── frontend/
    └── index.html        ← SPA with auth UI
```
