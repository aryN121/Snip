# 🔗 SNIP — URL Shortener (with Auth)

A full-stack URL shortener with secure authentication, analytics, and scalable API design.

##  Features
- URL shortening with unique identifiers
- JWT-based authentication (access + refresh tokens)
- Secure session handling using HTTP-only cookies
- Click tracking and basic analytics
- Google OAuth 2.0 login 
- RESTful API design

---
## Stack
- **Backend:** Node.js + Express + Postgresql + Prisma(ORM)
- **Auth:** JWT (access + refresh tokens) + Google OAuth 2.0
- **Frontend:** React Js

## Quick Start

```bash
cd backend
npm install
npm start

## Auth Flow
```
Register / Login  →  Access Token (15min) + Refresh Token cookie (7 days, httpOnly)
Expired access    →  Silent refresh via /api/auth/refresh
Logout            →  Refresh token deleted server-side
Google OAuth      →  Redirect flow → token in URL fragment → stored in sessionStorage
```

## API Reference
Auth
| Method | Endpoint                    | Description          |
| ------ | --------------------------- | -------------------- |
| POST   | `/api/auth/register`        | Register user        |
| POST   | `/api/auth/login`           | Login user           |
| POST   | `/api/auth/refresh`         | Refresh access token |
| POST   | `/api/auth/logout`          | Logout user          |
| GET    | `/api/auth/me`              | Get current user     |
| GET    | `/api/auth/google`          | Start Google OAuth   |
| GET    | `/api/auth/google/callback` | OAuth callback       |

URLs (Protected Routes)
| Method | Endpoint                | Description       |
| ------ | ----------------------- | ----------------- |
| POST   | `/api/shorten`          | Create short URL  |
| GET    | `/api/urls`             | Get all user URLs |
| GET    | `/api/urls/:code/stats` | Get analytics     |
| DELETE | `/api/urls/:code`       | Delete URL        |


## Project Structure

```

url-shortener/
├── backend/
│   ├── server.js         ← Express API + auth + redirects
│   ├── package.json
│   ├── .env.example      ← copy to .env
│   └── urls.db           ← auto-created SQLite DB
└── frontend/
    └── React Js        ← SPA with auth UI

    
```
