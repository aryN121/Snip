import express      from "express";
import cors         from "cors";
import cookieParser from "cookie-parser";
import Database     from "better-sqlite3";
import { nanoid }   from "nanoid";
import bcrypt       from "bcryptjs";
import jwt          from "jsonwebtoken";
import fetch        from "node-fetch";
import { fileURLToPath } from "url";
import path         from "path";


import dotenv from "dotenv";
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;

// ─── ENV / SECRETS ────────────────────────────────────────────────────────────
// Put these in a real .env file in production!
const JWT_SECRET         = process.env.JWT_SECRET         || "CHANGE_ME_jwt_secret_min32chars!!";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "CHANGE_ME_refresh_secret_min32!!";
const GOOGLE_CLIENT_ID   = process.env.GOOGLE_CLIENT_ID  ;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BASE_URL           = process.env.BASE_URL           || `http://localhost:${PORT}`;

const ACCESS_TOKEN_TTL  = "15m";
const REFRESH_TOKEN_TTL = "7d";
const REFRESH_TTL_MS    = 7 * 24 * 60 * 60 * 1000;

// ─── DATABASE ────────────────────────────────────────────────────────────────
const db = new Database(path.join(__dirname, "urls.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email        TEXT    UNIQUE,
    password_hash TEXT,
    name          TEXT    NOT NULL DEFAULT '',
    avatar        TEXT,
    provider      TEXT    NOT NULL DEFAULT 'local',
    google_id     TEXT    UNIQUE,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT    NOT NULL UNIQUE,
    expires_at TEXT    NOT NULL,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS urls (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    short_code  TEXT    NOT NULL UNIQUE,
    original    TEXT    NOT NULL,
    custom_slug TEXT,
    clicks      INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    short_code TEXT NOT NULL,
    clicked_at TEXT NOT NULL DEFAULT (datetime('now')),
    referrer   TEXT,
    user_agent TEXT
  );
`);

// ─── PREPARED STATEMENTS ─────────────────────────────────────────────────────
const q = {
  // users
  createUser:       db.prepare("INSERT INTO users (email, password_hash, name, provider) VALUES (?, ?, ?, ?)"),
  createOAuthUser:  db.prepare("INSERT INTO users (email, name, avatar, provider, google_id) VALUES (?, ?, ?, 'google', ?)"),
  findUserByEmail:  db.prepare("SELECT * FROM users WHERE email = ?"),
  findUserById:     db.prepare("SELECT id, email, name, avatar, provider, created_at FROM users WHERE id = ?"),
  findUserByGoogle: db.prepare("SELECT * FROM users WHERE google_id = ?"),
  updateGoogleUser: db.prepare("UPDATE users SET google_id = ?, avatar = ?, provider = 'google' WHERE email = ?"),

  // refresh tokens
  saveRefreshToken: db.prepare("INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)"),
  findRefreshToken: db.prepare("SELECT * FROM refresh_tokens WHERE token_hash = ?"),
  deleteRefreshToken: db.prepare("DELETE FROM refresh_tokens WHERE token_hash = ?"),
  deleteUserTokens: db.prepare("DELETE FROM refresh_tokens WHERE user_id = ?"),
  cleanExpiredTokens: db.prepare("DELETE FROM refresh_tokens WHERE expires_at < datetime('now')"),

  // urls
  insertUrl:        db.prepare("INSERT INTO urls (user_id, short_code, original, custom_slug) VALUES (?, ?, ?, ?)"),
  findByCode:       db.prepare("SELECT * FROM urls WHERE short_code = ?"),
  findByUrlAndUser: db.prepare("SELECT * FROM urls WHERE original = ? AND user_id = ?"),
  incrementClick:   db.prepare("UPDATE urls SET clicks = clicks + 1 WHERE short_code = ?"),
  logClick:         db.prepare("INSERT INTO clicks (short_code, referrer, user_agent) VALUES (?, ?, ?)"),
  listByUser:       db.prepare("SELECT * FROM urls WHERE user_id = ? ORDER BY created_at DESC LIMIT 100"),
  searchByUser:     db.prepare("SELECT * FROM urls WHERE user_id = ? AND (original LIKE ? OR short_code LIKE ?) ORDER BY created_at DESC LIMIT 50"),
  getStats:         db.prepare(`
    SELECT u.*, COUNT(c.id) as total_clicks, MAX(c.clicked_at) as last_clicked
    FROM urls u LEFT JOIN clicks c ON u.short_code = c.short_code
    WHERE u.short_code = ? AND u.user_id = ? GROUP BY u.id
  `),
  getClicksOverTime: db.prepare(`
    SELECT date(clicked_at) as day, COUNT(*) as count
    FROM clicks WHERE short_code = ?
    GROUP BY day ORDER BY day DESC LIMIT 30
  `),
  deleteUrl:        db.prepare("DELETE FROM urls WHERE short_code = ? AND user_id = ?"),
};

// ─── MIDDLEWARE ───────────────────────────────────────────────────────────────
app.use(cors({ origin: BASE_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "../frontend")));

// Clean up expired refresh tokens every hour
setInterval(() => q.cleanExpiredTokens.run(), 60 * 60 * 1000);

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function isValidUrl(str) {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch { return false; }
}

function isValidSlug(s) {
  return /^[a-zA-Z0-9_-]{3,30}$/.test(s);
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function makeAccessToken(user) {
  return jwt.sign({ sub: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

function makeRefreshToken(userId) {
  const token = nanoid(64);
  const hash  = Buffer.from(token).toString("base64"); // simple hash; use crypto in prod
  const expires = new Date(Date.now() + REFRESH_TTL_MS).toISOString();
  q.saveRefreshToken.run(userId, hash, expires);
  return token;
}

function setRefreshCookie(res, token) {
  res.cookie("refresh_token", token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   REFRESH_TTL_MS,
    path:     "/api/auth",
  });
}

// ─── AUTH MIDDLEWARE ──────────────────────────────────────────────────────────
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "No token provided" });
  try {
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch (e) {
    const msg = e.name === "TokenExpiredError" ? "Token expired" : "Invalid token";
    res.status(401).json({ error: msg });
  }
}

// ─── AUTH ROUTES ─────────────────────────────────────────────────────────────

// POST /api/auth/register
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name } = req.body;

  if (!email || !isValidEmail(email))          return res.status(400).json({ error: "Valid email required" });
  if (!password || password.length < 8)        return res.status(400).json({ error: "Password must be at least 8 characters" });
  if (!name || name.trim().length < 2)         return res.status(400).json({ error: "Name must be at least 2 characters" });

  if (q.findUserByEmail.get(email))            return res.status(409).json({ error: "Email already registered" });

  const hash = await bcrypt.hash(password, 12);
  const info = q.createUser.run(email.toLowerCase(), hash, name.trim(), "local");
  const user = { id: info.lastInsertRowid, email: email.toLowerCase(), name: name.trim() };

  const accessToken  = makeAccessToken(user);
  const refreshToken = makeRefreshToken(user.id);
  setRefreshCookie(res, refreshToken);

  res.status(201).json({ accessToken, user: { id: user.id, email: user.email, name: user.name } });
});

// POST /api/auth/login
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const user = q.findUserByEmail.get(email.toLowerCase());
  if (!user || user.provider !== "local")      return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok)                                     return res.status(401).json({ error: "Invalid credentials" });

  const accessToken  = makeAccessToken(user);
  const refreshToken = makeRefreshToken(user.id);
  setRefreshCookie(res, refreshToken);

  res.json({ accessToken, user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar } });
});

// POST /api/auth/refresh
app.post("/api/auth/refresh", (req, res) => {
  const token = req.cookies.refresh_token;
  if (!token) return res.status(401).json({ error: "No refresh token" });

  const hash = Buffer.from(token).toString("base64");
  const stored = q.findRefreshToken.get(hash);

  if (!stored || new Date(stored.expires_at) < new Date()) {
    q.deleteRefreshToken.run(hash);
    return res.status(401).json({ error: "Refresh token expired or invalid" });
  }

  const user = q.findUserById.get(stored.user_id);
  if (!user) return res.status(401).json({ error: "User not found" });

  // Rotate refresh token
  q.deleteRefreshToken.run(hash);
  const newRefresh = makeRefreshToken(user.id);
  const accessToken = makeAccessToken(user);
  setRefreshCookie(res, newRefresh);

  res.json({ accessToken, user });
});

// POST /api/auth/logout
app.post("/api/auth/logout", (req, res) => {
  const token = req.cookies.refresh_token;
  if (token) q.deleteRefreshToken.run(Buffer.from(token).toString("base64"));
  res.clearCookie("refresh_token", { path: "/api/auth" });
  res.json({ message: "Logged out" });
});

// GET /api/auth/me
app.get("/api/auth/me", authenticate, (req, res) => {
  const user = q.findUserById.get(req.user.sub);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// ─── GOOGLE OAUTH ─────────────────────────────────────────────────────────────
const loginWithGoogle = () => {
    window.location.href = "http://localhost:3001/api/auth/google";
};
// GET /api/auth/google  — redirect to Google
app.get("/api/auth/google", (req, res) => {
  if (!GOOGLE_CLIENT_ID) return res.status(501).json({ error: "Google OAuth not configured" });
  const params = new URLSearchParams({
    client_id:     GOOGLE_CLIENT_ID,
    redirect_uri:  `${BASE_URL}/api/auth/google/callback`,
    response_type: "code",
    scope:         "openid email profile",
    access_type:   "offline",
    prompt:        "select_account",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// GET /api/auth/google/callback
app.get("/api/auth/google/callback", async (req, res) => {
  const { code, error } = req.query;
  if (error || !code) return res.redirect("/?auth=error");

  try {
    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri:  `${BASE_URL}/api/auth/google/callback`,
        grant_type:    "authorization_code",
      }),
    });
    const tokens = await tokenRes.json();
    if (!tokens.id_token) throw new Error("No id_token");

    // Decode Google's ID token (we trust Google signed it)
    const payload = JSON.parse(Buffer.from(tokens.id_token.split(".")[1], "base64url").toString());
    const { sub: googleId, email, name, picture } = payload;

    // Find or create user
    let user = q.findUserByGoogle.get(googleId);
    if (!user) {
      const byEmail = q.findUserByEmail.get(email);
      if (byEmail) {
        // Link Google to existing local account
        q.updateGoogleUser.run(googleId, picture, email);
        user = q.findUserByEmail.get(email);
      } else {
        const info = q.createOAuthUser.run(email, name, picture, googleId);
        user = q.findUserById.get(info.lastInsertRowid);
      }
    }

    const accessToken  = makeAccessToken(user);
    const refreshToken = makeRefreshToken(user.id);
    setRefreshCookie(res, refreshToken);

    // Pass token to frontend via URL fragment (SPA-friendly)
    res.redirect(`/?token=${accessToken}`);
  } catch (e) {
    console.error("Google OAuth error:", e);
    res.redirect("/?auth=error");
  }
});

// ─── URL ROUTES (protected) ───────────────────────────────────────────────────

// POST /api/shorten
app.post("/api/shorten", authenticate, (req, res) => {
  const { url, customSlug } = req.body;
  const userId = req.user.sub;

  if (!url || !isValidUrl(url)) return res.status(400).json({ error: "Invalid or missing URL" });

  let shortCode;

  if (customSlug) {
    if (!isValidSlug(customSlug)) return res.status(400).json({ error: "Slug must be 3–30 chars: letters, numbers, hyphens, underscores" });
    if (q.findByCode.get(customSlug)) return res.status(409).json({ error: "Slug already taken" });
    shortCode = customSlug;
  } else {
    const existing = q.findByUrlAndUser.get(url, userId);
    if (existing) {
      return res.json({
        shortCode: existing.short_code,
        shortUrl:  `${req.protocol}://${req.get("host")}/${existing.short_code}`,
        original:  existing.original,
        clicks:    existing.clicks,
        createdAt: existing.created_at,
        reused:    true,
      });
    }
    shortCode = nanoid(7);
  }

  try {
    q.insertUrl.run(userId, shortCode, url, customSlug || null);
    res.status(201).json({
      shortCode,
      shortUrl:  `${req.protocol}://${req.get("host")}/${shortCode}`,
      original:  url,
      clicks:    0,
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create short URL" });
  }
});

// GET /api/urls
app.get("/api/urls", authenticate, (req, res) => {
  const { q: search } = req.query;
  const userId = req.user.sub;
  const rows = search
    ? q.searchByUser.all(userId, `%${search}%`, `%${search}%`)
    : q.listByUser.all(userId);
  res.json(rows);
});

// GET /api/urls/:code/stats
app.get("/api/urls/:code/stats", authenticate, (req, res) => {
  const stats = q.getStats.get(req.params.code, req.user.sub);
  if (!stats) return res.status(404).json({ error: "Not found" });
  const clicksOverTime = q.getClicksOverTime.all(req.params.code);
  res.json({ ...stats, clicksOverTime });
});

// DELETE /api/urls/:code
app.delete("/api/urls/:code", authenticate, (req, res) => {
  const info = q.deleteUrl.run(req.params.code, req.user.sub);
  if (info.changes === 0) return res.status(404).json({ error: "Not found or not yours" });
  res.json({ message: "Deleted" });
});

// ─── PUBLIC REDIRECT ──────────────────────────────────────────────────────────
app.get("/:code", (req, res) => {
  const { code } = req.params;
  if (code === "favicon.ico") return res.status(404).end();

  const row = q.findByCode.get(code);
  if (!row) return res.status(404).sendFile(path.join(__dirname, "../frontend/index.html"));

  q.incrementClick.run(code);
  q.logClick.run(code, req.get("referrer") || null, req.get("user-agent") || null);
  res.redirect(301, row.original);
});

// ─── ERROR HANDLER ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// ─── START ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🔗 SNIP running at http://localhost:${PORT}`);
  if (!GOOGLE_CLIENT_ID) console.log("⚠️  Google OAuth disabled — set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET to enable\n");
  else console.log("✅  Google OAuth enabled\n");
});
